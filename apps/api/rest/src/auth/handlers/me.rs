use actix_web::{HttpResponse, web};
use db::entity::user;
use sea_orm::{DatabaseConnection, EntityTrait};

use crate::auth::middleware::AuthenticatedUser;
use crate::auth::types::UserResponse;
use crate::error::{ApiError, ErrorResponse};

#[utoipa::path(
    get,
    path = "/api/auth/me",
    responses(
        (status = 200, description = "Current user", body = UserResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 404, description = "User not found", body = ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn me(
    db: web::Data<DatabaseConnection>,
    auth_user: AuthenticatedUser,
) -> Result<HttpResponse, ApiError> {
    let user_id = auth_user
        .user_id
        .ok_or_else(|| ApiError::Unauthorized("not authenticated".into()))?;

    let user = user::Entity::find_by_id(user_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("user not found".into()))?;

    Ok(HttpResponse::Ok().json(UserResponse {
        id: user.id,
        email: user.email,
    }))
}
