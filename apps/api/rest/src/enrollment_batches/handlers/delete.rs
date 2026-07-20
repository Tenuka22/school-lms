use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::enrollment_batches;
use sea_orm::{DatabaseConnection, EntityTrait};
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

    let exists = enrollment_batches::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .is_some();
    if !exists {
        return Err(ApiError::NotFound("batch not found".into()));
    }

    enrollment_batches::Entity::delete_by_id(id)
        .exec(db.as_ref())
        .await?;

    Ok(Json(MessageResponse { message: "batch deleted".into() }))
}
