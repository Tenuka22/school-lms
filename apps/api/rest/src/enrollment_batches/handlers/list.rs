use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::enrollment_batches;
use sea_orm::{DatabaseConnection, EntityTrait};

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "enrollment-batches", operation_id = "list-batches")]
pub async fn list_batches(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
) -> Result<Json<Vec<enrollment_batches::Model>>, ApiError> {
    auth.require_permission(Permission::EnrollmentBatchRead)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let batches = enrollment_batches::Entity::find().all(db.as_ref()).await?;
    Ok(Json(batches))
}
