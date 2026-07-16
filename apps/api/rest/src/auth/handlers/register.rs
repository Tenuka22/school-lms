use actix_web::{HttpResponse, web};
use chrono::{Duration, Utc};
use db::entity::{session, user};
use db::rbac::{ADMIN_EMAIL, assign_user_role};
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};

use crate::auth::middleware::JwtSecret;
use crate::auth::service::{create_access_token, generate_refresh_token, hash_password};
use crate::auth::types::{AuthResponse, RegisterRequest};
use crate::error::{ApiError, ErrorResponse};

#[utoipa::path(
    post,
    path = "/api/auth/register",
    request_body = RegisterRequest,
    responses(
        (status = 201, description = "User registered successfully", body = AuthResponse),
        (status = 400, description = "Validation error", body = ErrorResponse),
        (status = 409, description = "Email already registered", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse),
    ),
)]
pub async fn register(
    db: web::Data<DatabaseConnection>,
    body: web::Json<RegisterRequest>,
    jwt_secret: web::Data<JwtSecret>,
) -> Result<HttpResponse, ApiError> {
    if body.email.is_empty() {
        return Err(ApiError::BadRequest("email is required".into()));
    }

    if body.password.len() < 8 {
        return Err(ApiError::BadRequest(
            "password must be at least 8 characters".into(),
        ));
    }

    let existing = user::Entity::find()
        .filter(user::Column::Email.eq(&body.email))
        .one(db.as_ref())
        .await?;

    if existing.is_some() {
        return Err(ApiError::Conflict("email already registered".into()));
    }

    let password_hash = hash_password(&body.password).map_err(|e| {
        log::error!("Password hashing error: {e}");
        ApiError::Internal("internal error".into())
    })?;

    let now = Utc::now();
    let new_user = user::ActiveModel {
        email: Set(body.email.clone()),
        password_hash: Set(password_hash),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };

    let user = new_user.insert(db.as_ref()).await?;

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

    new_session.insert(db.as_ref()).await?;

    let access_token = create_access_token(user.id, &jwt_secret.0).map_err(|e| {
        log::error!("JWT creation error: {e}");
        ApiError::Internal("internal error".into())
    })?;

    Ok(HttpResponse::Created().json(AuthResponse {
        access_token,
        refresh_token: raw_refresh,
    }))
}
