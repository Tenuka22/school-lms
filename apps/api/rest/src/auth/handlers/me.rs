use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::user;
use sea_orm::{DatabaseConnection, EntityTrait};

use crate::auth::middleware::AuthenticatedUser;
use crate::auth::types::UserResponse;
use crate::error::ApiError;

#[api_operation(tag = "auth", operation_id = "me")]
pub async fn me(
    db: web::Data<DatabaseConnection>,
    auth_user: AuthenticatedUser,
) -> Result<Json<UserResponse>, ApiError> {
    let user_id = auth_user
        .user_id
        .ok_or_else(|| ApiError::unauthorized("not authenticated"))?;

    let user = user::Entity::find_by_id(user_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::not_found("user not found"))?;

    let roles = db::rbac::get_user_roles(&db, user_id).await.map_err(|e| {
        log::error!("Failed to load roles: {e}");
        ApiError::internal("role lookup failed")
    })?;

    let role = roles
        .first()
        .map(|r| r.to_string())
        .unwrap_or_else(|| "unknown".into());

    Ok(Json(UserResponse {
        id: user.id.to_string(),
        email: user.email,
        role,
    }))
}
