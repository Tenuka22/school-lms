use actix_web::{HttpResponse, web};
use db::entity::session;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

use crate::auth::service::hash_refresh_token;
use crate::auth::types::RefreshRequest;
use crate::docs::MessageResponse;
use crate::error::{ApiError, ErrorResponse};

#[utoipa::path(
    post,
    path = "/api/auth/logout",
    request_body = RefreshRequest,
    responses(
        (status = 200, description = "Logged out successfully", body = MessageResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse),
    ),
)]
pub async fn logout(
    db: web::Data<DatabaseConnection>,
    body: web::Json<RefreshRequest>,
) -> Result<HttpResponse, ApiError> {
    let token_hash = hash_refresh_token(&body.refresh_token);

    session::Entity::delete_many()
        .filter(session::Column::RefreshTokenHash.eq(&token_hash))
        .exec(db.as_ref())
        .await?;

    Ok(HttpResponse::Ok().json(MessageResponse {
        message: "logged out".into(),
    }))
}
