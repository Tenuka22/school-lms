use actix_web::{HttpResponse, web};
use db::entity::session;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

use crate::auth::middleware::AuthenticatedUser;
use crate::docs::MessageResponse;
use crate::error::{ApiError, ErrorResponse};

#[utoipa::path(
    post,
    path = "/api/auth/logout-all",
    responses(
        (status = 200, description = "All sessions revoked", body = MessageResponse),
        (status = 401, description = "Not authenticated", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn logout_all(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
) -> Result<HttpResponse, ApiError> {
    let user_id = auth
        .user_id
        .ok_or_else(|| ApiError::Unauthorized("not authenticated".into()))?;

    session::Entity::delete_many()
        .filter(session::Column::UserId.eq(user_id))
        .exec(db.as_ref())
        .await?;

    Ok(HttpResponse::Ok().json(MessageResponse {
        message: "all sessions revoked".into(),
    }))
}
