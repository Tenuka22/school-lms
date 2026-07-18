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
        .ok_or_else(|| ApiError::Unauthorized("not authenticated".into()))?;

    let user = user::Entity::find_by_id(user_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("user not found".into()))?;

    Ok(Json(UserResponse {
        id: user.id.to_string(),
        email: user.email,
    }))
}
