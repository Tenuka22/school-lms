use actix_web::{HttpResponse, web};
use db::entity::enrollment_batches;
use sea_orm::{DatabaseConnection, EntityTrait};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::docs::MessageResponse;
use crate::error::ApiError;
use db::rbac::Permission;

#[utoipa::path(
    delete,
    path = "/api/enrollment-batches/{id}",
    params(
        ("id" = Uuid, Path, description = "Batch ID"),
    ),
    responses(
        (status = 200, description = "Batch deleted", body = MessageResponse),
        (status = 403, description = "Insufficient permissions", body = crate::error::ErrorResponse),
        (status = 404, description = "Batch not found", body = crate::error::ErrorResponse),
        (status = 500, description = "Internal server error", body = crate::error::ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn delete_batch(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    auth.require_permission(Permission::All)
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

    Ok(HttpResponse::Ok().json(MessageResponse { message: "batch deleted".into() }))
}
