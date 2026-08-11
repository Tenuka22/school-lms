use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::session;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

use crate::auth::service::hash_refresh_token;
use crate::auth::types::RefreshRequest;
use crate::docs::MessageResponse;
use crate::error::ApiError;

#[api_operation(tag = "auth", operation_id = "logout")]
pub async fn logout(
    db: web::Data<DatabaseConnection>,
    body: Json<RefreshRequest>,
) -> Result<Json<MessageResponse>, ApiError> {
    let token_hash = hash_refresh_token(&body.refresh_token);

    session::Entity::delete_many()
        .filter(session::Column::RefreshTokenHash.eq(&token_hash))
        .exec(db.as_ref())
        .await?;

    Ok(Json(MessageResponse {
        message: "logged out".into(),
    }))
}
