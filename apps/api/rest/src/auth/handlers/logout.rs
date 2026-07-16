use actix_web::{HttpResponse, web};
use db::entity::session;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

use crate::auth::service::hash_refresh_token;
use crate::auth::types::RefreshRequest;

pub async fn logout(
    db: web::Data<DatabaseConnection>,
    body: web::Json<RefreshRequest>,
) -> HttpResponse {
    let token_hash = hash_refresh_token(&body.refresh_token);

    match session::Entity::delete_many()
        .filter(session::Column::RefreshTokenHash.eq(&token_hash))
        .exec(db.as_ref())
        .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "logged out"})),
        Err(e) => {
            log::error!("Failed to delete session: {e}");
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "internal error"}))
        }
    }
}
