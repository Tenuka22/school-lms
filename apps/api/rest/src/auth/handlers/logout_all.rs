use actix_web::{HttpResponse, web};
use db::entity::session;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

use crate::auth::middleware::AuthenticatedUser;

pub async fn logout_all(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
) -> HttpResponse {
    let user_id = match auth.user_id {
        Some(uid) => uid,
        None => {
            return HttpResponse::Unauthorized()
                .json(serde_json::json!({"error": "not authenticated"}));
        }
    };

    match session::Entity::delete_many()
        .filter(session::Column::UserId.eq(user_id))
        .exec(db.as_ref())
        .await
    {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({"message": "all sessions revoked"})),
        Err(e) => {
            log::error!("Failed to revoke all sessions: {e}");
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "internal error"}))
        }
    }
}
