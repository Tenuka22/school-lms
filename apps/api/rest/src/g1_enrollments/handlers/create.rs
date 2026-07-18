use actix_web::{web, web::Json};
use apistos::actix::CreatedJson;
use apistos::api_operation;
use chrono::Utc;
use db::entity::{enrollment_batches, g1_enrollments, g1_enrollments_audit};
use db::entity::enums::AuditOperation;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "g1-enrollments", operation_id = "create-enrollment")]
pub async fn create_enrollment(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<g1_enrollments::Model>,
) -> Result<CreatedJson<g1_enrollments::Model>, ApiError> {
    auth.require_permission(Permission::All)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let mut data = body.into_inner();

    let batch_exists = enrollment_batches::Entity::find()
        .filter(enrollment_batches::Column::Id.eq(data.batch_id))
        .one(db.as_ref())
        .await?
        .is_some();
    if !batch_exists {
        return Err(ApiError::BadRequest(format!("batch {} not found", data.batch_id)));
    }

    data.id = Uuid::new_v4();
    data.created_at = Utc::now();
    data.updated_at = Utc::now();
    data.created_by = None;
    data.updated_by = None;

    let active: g1_enrollments::ActiveModel = data.into();
    let saved = active.insert(db.as_ref()).await?;

    let new_json = serde_json::to_value(&saved).ok();
    g1_enrollments_audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        enrollment_id: Set(Some(saved.id)),
        operation: Set(AuditOperation::Insert),
        changed_fields: Set(None),
        old_values: Set(None),
        new_values: Set(new_json),
        changed_by: Set(None),
        changed_at: Set(Utc::now()),
        context: Set(None),
    }
    .insert(db.as_ref())
    .await?;

    Ok(CreatedJson(saved))
}
