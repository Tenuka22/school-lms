use actix_web::{web, web::Json};
use apistos::api_operation;
use chrono::Utc;
use db::entity::common::enums::{AuditOperation, EnrollmentStatus};
use db::entity::g1::applications;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::docs::MessageResponse;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "g1-applications", operation_id = "delete-application")]
pub async fn delete_application(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<MessageResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationDelete)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();

    let existing = applications::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("application not found".into()))?;

    if existing.enrollment_status != EnrollmentStatus::Pending
        && existing.enrollment_status != EnrollmentStatus::Rejected
    {
        return Err(ApiError::BadRequest(
            "only pending or rejected applications can be deleted".into(),
        ));
    }

    let old_json = serde_json::to_value(&existing).ok();

    applications::Entity::delete_by_id(id)
        .exec(db.as_ref())
        .await?;

    db::entity::g1::audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        application_id: Set(Some(id)),
        operation: Set(AuditOperation::Delete),
        changed_fields: Set(None),
        old_values: Set(old_json),
        new_values: Set(None),
        changed_by: Set(auth.user_id),
        changed_at: Set(Utc::now()),
        context: Set(None),
    }
    .insert(db.as_ref())
    .await?;

    Ok(Json(MessageResponse {
        message: "application deleted".into(),
    }))
}
