use actix_web::{HttpResponse, web};
use db::entity::g1_enrollments;
use sea_orm::{DatabaseConnection, EntityTrait};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[utoipa::path(
    get,
    path = "/api/g1-enrollments/{id}",
    params(
        ("id" = Uuid, Path, description = "Enrollment ID"),
    ),
    responses(
        (status = 200, description = "Enrollment retrieved"),
        (status = 403, description = "Insufficient permissions", body = crate::error::ErrorResponse),
        (status = 404, description = "Enrollment not found", body = crate::error::ErrorResponse),
        (status = 500, description = "Internal server error", body = crate::error::ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn get_enrollment(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<HttpResponse, ApiError> {
    auth.require_permission(Permission::All)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let enrollment = g1_enrollments::Entity::find_by_id(id.into_inner())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("enrollment not found".into()))?;

    Ok(HttpResponse::Ok().json(enrollment))
}
