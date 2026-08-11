use actix_web::{web, web::Json};
use apistos::api_operation;
use chrono::{Duration, Utc};
use db::entity::{session, user};
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};

use crate::auth::middleware::JwtSecret;
use crate::auth::service::{create_access_token, generate_refresh_token, verify_password};
use crate::auth::types::{AuthResponse, LoginRequest};
use crate::error::ApiError;

#[api_operation(tag = "auth", operation_id = "login")]
pub async fn login(
    db: web::Data<DatabaseConnection>,
    body: Json<LoginRequest>,
    jwt_secret: web::Data<JwtSecret>,
) -> Result<Json<AuthResponse>, ApiError> {
    let user = user::Entity::find()
        .filter(user::Column::Email.eq(&body.email))
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::unauthorized("invalid email or password"))?;

    let valid = verify_password(&body.password, &user.password_hash).map_err(|e| {
        log::error!("Password verification error: {e}");
        ApiError::internal("internal error")
    })?;

    if !valid {
        return Err(ApiError::unauthorized("invalid email or password"));
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

    new_session.insert(db.as_ref()).await?;

    let access_token = create_access_token(user.id, &jwt_secret.0).map_err(|e| {
        log::error!("JWT creation error: {e}");
        ApiError::internal("internal error")
    })?;

    let access_expires_at = (now + Duration::minutes(15)).timestamp();

    Ok(Json(AuthResponse {
        access_token,
        refresh_token: raw_refresh,
        expires_at: access_expires_at,
    }))
}
