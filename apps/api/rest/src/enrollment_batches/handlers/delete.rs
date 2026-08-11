use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::common::enums::AuditOperation;
use db::entity::enrollment_batches;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::docs::MessageResponse;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "enrollment-batches", operation_id = "delete-batch")]
pub async fn delete_batch(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<MessageResponse>, ApiError> {
    auth.require_permission(Permission::EnrollmentBatchDelete)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();

    let existing = enrollment_batches::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?;
    let batch = match existing {
        Some(b) => b,
        None => return Err(ApiError::NotFound("batch not found".into())),
    };

    let _ = db::entity::audit_logs::ActiveModel {
        id: Set(Uuid::new_v4()),
        table_name: Set("enrollment_batches".to_string()),
        record_id: Set(id),
        action: Set(AuditOperation::Delete),
        old_values: Set(Some(serde_json::to_value(&batch).unwrap_or_default())),
        new_values: Set(None),
        performed_by: Set(auth.user_id),
        performed_at: Set(chrono::Utc::now()),
        ip_address: Set(None),
        reason: Set(Some(format!("batch {} deleted", batch.batch_code))),
    }
    .insert(db.as_ref())
    .await;

    enrollment_batches::Entity::delete_by_id(id)
        .exec(db.as_ref())
        .await?;

    Ok(Json(MessageResponse {
        message: "batch deleted".into(),
    }))
}
