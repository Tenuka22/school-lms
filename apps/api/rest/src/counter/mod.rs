pub mod service;

use actix_web::{HttpResponse, web};
use sea_orm::DatabaseConnection;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::{ApiError, ErrorResponse};
use db::rbac::Permission;
use service::{CounterResponse, CounterTarget};

#[utoipa::path(
    get,
    path = "/api/counter/{name}",
    params(
        ("name" = String, Path, description = "Counter name"),
    ),
    responses(
        (status = 200, description = "Counter value retrieved", body = CounterResponse),
        (status = 403, description = "Insufficient permissions", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn get_counter(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    auth.require_permission(Permission::CounterRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let counter = service::get(db.as_ref(), &name, &CounterTarget::Normal).await?;
    Ok(HttpResponse::Ok().json(counter))
}

#[utoipa::path(
    post,
    path = "/api/counter/{name}/increment",
    params(
        ("name" = String, Path, description = "Counter name"),
    ),
    responses(
        (status = 200, description = "Counter incremented", body = CounterResponse),
        (status = 403, description = "Insufficient permissions", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
),
)]
pub async fn increment_counter(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    auth.require_permission(Permission::CounterIncrement)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let name = name.into_inner();

    service::get(db.as_ref(), &name, &CounterTarget::Normal).await?;
    let counter = service::increment(db.as_ref(), &name, &CounterTarget::Normal).await?;
    Ok(HttpResponse::Ok().json(counter))
}

#[utoipa::path(
    get,
    path = "/api/counter/secure/{name}",
    params(
        ("name" = String, Path, description = "Secure counter name"),
    ),
    responses(
        (status = 200, description = "Secure counter value retrieved", body = CounterResponse),
        (status = 403, description = "Insufficient permissions", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn get_secure_counter(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    auth.require_permission(Permission::CounterSecureRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let counter = service::get(db.as_ref(), &name, &CounterTarget::Secure).await?;
    Ok(HttpResponse::Ok().json(counter))
}

#[utoipa::path(
    post,
    path = "/api/counter/secure/{name}/increment",
    params(
        ("name" = String, Path, description = "Secure counter name"),
    ),
    responses(
        (status = 200, description = "Secure counter incremented", body = CounterResponse),
        (status = 403, description = "Insufficient permissions", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn increment_secure_counter(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: web::Path<String>,
) -> Result<HttpResponse, ApiError> {
    auth.require_permission(Permission::CounterSecureIncrement)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let name = name.into_inner();

    service::get(db.as_ref(), &name, &CounterTarget::Secure).await?;
    let counter = service::increment(db.as_ref(), &name, &CounterTarget::Secure).await?;
    Ok(HttpResponse::Ok().json(counter))
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/counter/{name}", web::get().to(get_counter))
        .route(
            "/counter/{name}/increment",
            web::post().to(increment_counter),
        )
        .route("/counter/secure/{name}", web::get().to(get_secure_counter))
        .route(
            "/counter/secure/{name}/increment",
            web::post().to(increment_secure_counter),
        );
}
