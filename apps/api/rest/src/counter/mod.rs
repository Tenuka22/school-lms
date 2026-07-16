mod service;

use actix_web::{HttpResponse, web};
use sea_orm::DatabaseConnection;

use crate::auth::middleware::AuthenticatedUser;
use db::rbac::Permission;
use service::CounterTarget;

async fn get_counter(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: web::Path<String>,
) -> HttpResponse {
    if auth.require_permission(Permission::CounterRead).is_err() {
        return HttpResponse::Forbidden().body("insufficient permissions");
    }

    match service::get(db.as_ref(), &name, &CounterTarget::Normal).await {
        Ok(r) => HttpResponse::Ok().json(r),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

async fn increment_counter(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: web::Path<String>,
) -> HttpResponse {
    if auth
        .require_permission(Permission::CounterIncrement)
        .is_err()
    {
        return HttpResponse::Forbidden().body("insufficient permissions");
    }

    let name = name.into_inner();

    match service::get(db.as_ref(), &name, &CounterTarget::Normal).await {
        Ok(_) => match service::increment(db.as_ref(), &name, &CounterTarget::Normal).await {
            Ok(r) => HttpResponse::Ok().json(r),
            Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
        },
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

async fn get_secure_counter(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: web::Path<String>,
) -> HttpResponse {
    if auth
        .require_permission(Permission::CounterSecureRead)
        .is_err()
    {
        return HttpResponse::Forbidden().body("insufficient permissions");
    }

    match service::get(db.as_ref(), &name, &CounterTarget::Secure).await {
        Ok(r) => HttpResponse::Ok().json(r),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

async fn increment_secure_counter(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    name: web::Path<String>,
) -> HttpResponse {
    if auth
        .require_permission(Permission::CounterSecureIncrement)
        .is_err()
    {
        return HttpResponse::Forbidden().body("insufficient permissions");
    }

    let name = name.into_inner();

    match service::get(db.as_ref(), &name, &CounterTarget::Secure).await {
        Ok(_) => match service::increment(db.as_ref(), &name, &CounterTarget::Secure).await {
            Ok(r) => HttpResponse::Ok().json(r),
            Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
        },
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
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
