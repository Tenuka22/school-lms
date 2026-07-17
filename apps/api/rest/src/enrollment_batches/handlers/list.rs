use actix_web::{HttpResponse, web};
use db::entity::enrollment_batches;
use sea_orm::{DatabaseConnection, EntityTrait};

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[utoipa::path(
    get,
    path = "/api/enrollment-batches",
    responses(
        (status = 200, description = "List of enrollment batches"),
        (status = 403, description = "Insufficient permissions", body = crate::error::ErrorResponse),
        (status = 500, description = "Internal server error", body = crate::error::ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn list_batches(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
) -> Result<HttpResponse, ApiError> {
    auth.require_permission(Permission::All)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let batches = enrollment_batches::Entity::find().all(db.as_ref()).await?;
    Ok(HttpResponse::Ok().json(batches))
}
