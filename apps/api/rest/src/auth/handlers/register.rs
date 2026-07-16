use actix_web::{HttpResponse, web};
use chrono::{Duration, Utc};
use db::entity::{session, user};
use db::rbac::{ADMIN_EMAIL, assign_user_role};
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};

use crate::auth::middleware::JwtSecret;
use crate::auth::service::{create_access_token, generate_refresh_token, hash_password};
use crate::auth::types::{AuthResponse, RegisterRequest};

pub async fn register(
    db: web::Data<DatabaseConnection>,
    body: web::Json<RegisterRequest>,
    jwt_secret: web::Data<JwtSecret>,
) -> HttpResponse {
    if body.email.is_empty() {
        return HttpResponse::BadRequest().json(serde_json::json!({"error": "email is required"}));
    }

    if body.password.len() < 8 {
        return HttpResponse::BadRequest()
            .json(serde_json::json!({"error": "password must be at least 8 characters"}));
    }

    let existing = user::Entity::find()
        .filter(user::Column::Email.eq(&body.email))
        .one(db.as_ref())
        .await;

    match existing {
        Ok(Some(_)) => {
            return HttpResponse::Conflict()
                .json(serde_json::json!({"error": "email already registered"}));
        }
        Err(e) => {
            log::error!("DB error checking existing user: {e}");
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "internal error"}));
        }
        _ => {}
    }

    let password_hash = match hash_password(&body.password) {
        Ok(h) => h,
        Err(e) => {
            log::error!("Password hashing error: {e}");
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "internal error"}));
        }
    };

    let now = Utc::now();
    let new_user = user::ActiveModel {
        email: Set(body.email.clone()),
        password_hash: Set(password_hash),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };

    let user = match new_user.insert(db.as_ref()).await {
        Ok(u) => u,
        Err(e) => {
            log::error!("Failed to insert user: {e}");
            return HttpResponse::InternalServerError()
                .json(serde_json::json!({"error": "internal error"}));
        }
    };

    if let Err(e) = assign_user_role(db.as_ref(), user.id, "unknown").await {
        log::error!("Failed to assign unknown role: {e}");
    }

    if body.email == ADMIN_EMAIL {
        if let Err(e) = assign_user_role(db.as_ref(), user.id, "admin").await {
            log::error!("Failed to assign admin role: {e}");
        }
    }

    let (raw_refresh, refresh_hash) = generate_refresh_token();
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

    HttpResponse::Created().json(AuthResponse {
        access_token,
        refresh_token: raw_refresh,
    })
}
