mod auth;
mod counter;
pub mod storage;
mod uploads;
pub mod docs;
pub mod error;

use actix_web::web;

pub use auth::{AuthMiddleware, Claims, JwtSecret};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .wrap(actix_web::middleware::NormalizePath::new(
                actix_web::middleware::TrailingSlash::Trim,
            ))
            .wrap(auth::AuthMiddleware)
            .configure(counter::routes)
            .configure(uploads::routes)
            .service(web::scope("/auth").configure(auth::routes))
            .configure(docs::routes),
    );
}
