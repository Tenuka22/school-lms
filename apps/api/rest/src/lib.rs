mod auth;
mod counter;
mod enrollment_batches;
mod g1_applications;
mod guardians;
mod past_pupil_details;
mod schools;
mod staff_details;
mod students;
pub mod storage;
mod uploads;
mod workspace_addresses;
pub mod docs;
pub mod error;

use apistos::web;

pub use auth::{AuthMiddleware, Claims, JwtSecret};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .wrap(actix_web::middleware::NormalizePath::new(
                actix_web::middleware::TrailingSlash::Trim,
            ))
            .wrap(auth::AuthMiddleware)
            .configure(counter::routes)
            .configure(g1_applications::routes)
            .configure(enrollment_batches::routes)
            .configure(guardians::routes)
            .configure(past_pupil_details::routes)
            .configure(schools::routes)
            .configure(staff_details::routes)
            .configure(students::routes)
            .configure(workspace_addresses::routes)
            .configure(uploads::routes)
            .service(web::scope("/auth").configure(auth::routes)),
    );
}
