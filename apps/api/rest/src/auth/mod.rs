pub mod handlers;
pub mod middleware;
pub mod service;
pub mod types;

pub use middleware::{AuthMiddleware, Claims, JwtSecret};

use actix_web::web;

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/register", web::post().to(handlers::register::register))
        .route("/login", web::post().to(handlers::login::login))
        .route("/refresh", web::post().to(handlers::refresh::refresh))
        .route("/logout", web::post().to(handlers::logout::logout))
        .route(
            "/logout-all",
            web::post().to(handlers::logout_all::logout_all),
        );
}
