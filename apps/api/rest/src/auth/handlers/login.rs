use actix_web::{HttpResponse, web};
use chrono::{Duration, Utc};
use db::entity::{session, user};
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};

use crate::auth::middleware::JwtSecret;
use crate::auth::service::{create_access_token, generate_refresh_token, verify_password};
use crate::auth::types::{AuthResponse, LoginRequest};

pub async fn login(
    db: web::Data<DatabaseConnection>,
    body: web::Json<LoginRequest>,
    jwt_secret: web::Data<JwtSecret>,
) -> HttpResponse {
    let existing = match user::Entity::find()
        .filter(user::Column::Email.eq(&body.email))
        .one(db.as_ref())
        .await
    {
        Ok(u) => u,
        Err(e) => {
            log::error!("DB error finding user: {e}");
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "internal error"}));
        }
    };

    let user = match existing {
        Some(u) => u,
        None => {
            return HttpResponse::Unauthorized()
                .json(serde_json::json!({"error": "invalid email or password"}));
        }
    };

    match verify_password(&body.password, &user.password_hash) {
        Ok(true) => {}
        Ok(false) => {
            return HttpResponse::Unauthorized()
                .json(serde_json::json!({"error": "invalid email or password"}));
        }
        Err(e) => {
            log::error!("Password verification error: {e}");
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "internal error"}));
        }
    }

    let (raw_refresh, refresh_hash) = generate_refresh_token();
    let now = Utc::now();
    let session_expires = now + Duration::days(30);

    let new_session = session::ActiveModel {
        user_id: Set(user.id),
        refresh_token_hash: Set(refresh_hash),
        issued_at: Set(now),
        expires_at: Set(session_expires),
        revoked_at: Set(None),
        user_agent: Set(None),
        ip: Set(None),
        ..Default::default()
    };

    if let Err(e) = new_session.insert(db.as_ref()).await {
        log::error!("Failed to create session: {e}");
        return HttpResponse::InternalServerError()
            .json(serde_json::json!({"error": "internal error"}));
    }

    let access_token = match create_access_token(user.id, &jwt_secret.0) {
        Ok(t) => t,
        Err(e) => {
            log::error!("JWT creation error: {e}");
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "internal error"}));
        }
    };

    HttpResponse::Ok().json(AuthResponse {
        access_token,
        refresh_token: raw_refresh,
    })
}
