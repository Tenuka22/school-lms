use actix_web::{web, web::Json};
use apistos::api_operation;
use chrono::Utc;
use db::entity::{g1_enrollments, g1_enrollments_audit};
use db::entity::enums::AuditOperation;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::docs::MessageResponse;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "g1-enrollments", operation_id = "delete-enrollment")]
pub async fn delete_enrollment(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<MessageResponse>, ApiError> {
    auth.require_permission(Permission::All)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();

    let existing = g1_enrollments::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("enrollment not found".into()))?;

    let old_json = serde_json::to_value(&existing).ok();

    g1_enrollments::Entity::delete_by_id(id)
        .exec(db.as_ref())
        .await?;

    g1_enrollments_audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        enrollment_id: Set(Some(id)),
        operation: Set(AuditOperation::Delete),
        changed_fields: Set(None),
        old_values: Set(old_json),
        new_values: Set(None),
        changed_by: Set(None),
        changed_at: Set(Utc::now()),
        context: Set(None),
    }
    .insert(db.as_ref())
    .await?;

    Ok(Json(MessageResponse { message: "enrollment deleted".into() }))
}
