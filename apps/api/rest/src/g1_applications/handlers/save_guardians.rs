use actix_web::web;
use apistos::ApiComponent;
use apistos::api_operation;
use chrono::Utc;
use db::entity::common::enums::AuditOperation;
use db::entity::common::guardians;
use db::entity::g1::applications;
use db::entity::g1::join_guardians;
use log::{info, warn};
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Deserialize, JsonSchema, ApiComponent)]
pub struct SaveGuardiansRequest {
    pub guardian_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct SaveGuardiansResponse {
    pub count: usize,
}

#[api_operation(tag = "g1-applications", operation_id = "save-guardians")]
pub async fn save_guardians(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: web::Json<SaveGuardiansRequest>,
) -> Result<web::Json<SaveGuardiansResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let app_id = id.into_inner();
    let user_id = auth.user_id;
    let requested_ids = &body.guardian_ids;

    info!("[save_guardians] user={user_id:?} app={app_id} requested_ids={requested_ids:?}");

    applications::Entity::find_by_id(app_id)
        .filter(applications::Column::DeletedAt.is_null())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| {
            warn!("[save_guardians] application {app_id} not found");
            ApiError::NotFound("Application not found".into())
        })?;

    // Delete existing joins
    let deleted = join_guardians::Entity::delete_many()
        .filter(join_guardians::Column::ApplicationId.eq(app_id))
        .exec(db.as_ref())
        .await?;

    info!("[save_guardians] deleted {deleted:?} existing join rows for app {app_id}");

    // Look up guardians to get relationship types
    let guardians = guardians::Entity::find()
        .filter(guardians::Column::Id.is_in(body.guardian_ids.clone()))
        .all(db.as_ref())
        .await?;

    info!(
        "[save_guardians] found {} guardians out of {} requested",
        guardians.len(),
        requested_ids.len()
    );

    let mut count = 0;
    for g in &guardians {
        let relationship = g.relationship_type.clone();
        info!(
            "[save_guardians] inserting join guardian_id={} relationship={relationship:?} is_primary={}",
            g.id,
            count == 0
        );
        join_guardians::ActiveModel {
            id: Set(Uuid::new_v4()),
            application_id: Set(app_id),
            guardian_id: Set(g.id),
            relationship: Set(relationship),
            is_primary: Set(count == 0),
            created_at: Set(Utc::now()),
        }
        .insert(db.as_ref())
        .await?;
        count += 1;
    }

    info!("[save_guardians] success count={}", count);

    crate::audit::log_application_change(
        db.as_ref(),
        app_id,
        AuditOperation::Update,
        None,
        Some(serde_json::json!({"guardian_ids": requested_ids, "count": count})),
        &auth,
        Some(format!("guardians saved: {} linked", count)),
    )
    .await;

    Ok(web::Json(SaveGuardiansResponse { count }))
}
