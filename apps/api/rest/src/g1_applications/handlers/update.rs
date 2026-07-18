use actix_web::{web, web::Json};
use apistos::api_operation;
use chrono::Utc;
use db::entity::common::enums::{AuditOperation, ApplicationStatus};
use db::entity::g1::applications;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "g1-applications", operation_id = "update-application")]
pub async fn update_application(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: Json<applications::Model>,
) -> Result<Json<applications::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();

    let existing = applications::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("application not found".into()))?;

    if existing.status != ApplicationStatus::Draft
        && existing.status != ApplicationStatus::Rejected
    {
        return Err(ApiError::BadRequest(
            "cannot update application in current status".into(),
        ));
    }

    let old_json = serde_json::to_value(&existing).ok();

    let mut active: applications::ActiveModel = body.into_inner().into();
    active.id = Set(id);
    active.updated_at = Set(Utc::now());

    let saved = active.update(db.as_ref()).await?;
    let new_json = serde_json::to_value(&saved).ok();

    db::entity::g1::audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        application_id: Set(Some(id)),
        operation: Set(AuditOperation::Update),
        changed_fields: Set(None),
        old_values: Set(old_json),
        new_values: Set(new_json),
        changed_by: Set(auth.user_id),
        changed_at: Set(Utc::now()),
        context: Set(None),
    }
    .insert(db.as_ref())
    .await?;

    Ok(Json(saved))
}
