use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::enrollment_batches;
use sea_orm::{DatabaseConnection, EntityTrait};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "enrollment-batches", operation_id = "get-batch")]
pub async fn get_batch(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<enrollment_batches::Model>, ApiError> {
    auth.require_permission(Permission::All)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let batch = enrollment_batches::Entity::find_by_id(id.into_inner())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("batch not found".into()))?;

    Ok(Json(batch))
}
