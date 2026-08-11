use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::session;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

use crate::auth::middleware::AuthenticatedUser;
use crate::docs::MessageResponse;
use crate::error::ApiError;

#[api_operation(tag = "auth", operation_id = "logout-all")]
pub async fn logout_all(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
) -> Result<Json<MessageResponse>, ApiError> {
    let user_id = auth
        .user_id
        .ok_or_else(|| ApiError::unauthorized("not authenticated"))?;

    session::Entity::delete_many()
        .filter(session::Column::UserId.eq(user_id))
        .exec(db.as_ref())
        .await?;

    Ok(Json(MessageResponse {
        message: "all sessions revoked".into(),
    }))
}
