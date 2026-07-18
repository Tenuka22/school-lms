pub mod service;

use actix_web::web::Json;
use apistos::api_operation;
use apistos::web;
use sea_orm::DatabaseConnection;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;
use service::{CounterResponse, CounterTarget};

#[api_operation(tag = "counter", operation_id = "get-counter")]
pub async fn get_counter(
    db: actix_web::web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: actix_web::web::Path<String>,
) -> Result<Json<CounterResponse>, ApiError> {
    auth.require_permission(Permission::CounterRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let counter = service::get(db.as_ref(), &name, &CounterTarget::Normal).await?;
    Ok(Json(counter))
}

#[api_operation(tag = "counter", operation_id = "increment-counter")]
pub async fn increment_counter(
    db: actix_web::web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: actix_web::web::Path<String>,
) -> Result<Json<CounterResponse>, ApiError> {
    auth.require_permission(Permission::CounterIncrement)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let name = name.into_inner();

    service::get(db.as_ref(), &name, &CounterTarget::Normal).await?;
    let counter = service::increment(db.as_ref(), &name, &CounterTarget::Normal).await?;
    Ok(Json(counter))
}

#[api_operation(tag = "counter", operation_id = "get-secure-counter")]
pub async fn get_secure_counter(
    db: actix_web::web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: actix_web::web::Path<String>,
) -> Result<Json<CounterResponse>, ApiError> {
    auth.require_permission(Permission::CounterSecureRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let counter = service::get(db.as_ref(), &name, &CounterTarget::Secure).await?;
    Ok(Json(counter))
}

#[api_operation(tag = "counter", operation_id = "increment-secure-counter")]
pub async fn increment_secure_counter(
    db: actix_web::web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: actix_web::web::Path<String>,
) -> Result<Json<CounterResponse>, ApiError> {
    auth.require_permission(Permission::CounterSecureIncrement)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let name = name.into_inner();

    service::get(db.as_ref(), &name, &CounterTarget::Secure).await?;
    let counter = service::increment(db.as_ref(), &name, &CounterTarget::Secure).await?;
    Ok(Json(counter))
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
