mod auth;
mod blacklist;
mod counter;
pub mod docs;
mod addresses;
mod children;
mod districts;
mod enrollment_batches;
pub mod error;
mod g1_applications;
mod guardians;
mod staff_details;
mod past_pupil_details;
mod schools;
pub mod storage;
mod students;
mod uploads;
pub mod validation;
mod workspace_addresses;

use apistos::web;

pub use auth::{AuthMiddleware, Claims, JwtSecret};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .wrap(actix_web::middleware::NormalizePath::new(
                actix_web::middleware::TrailingSlash::Trim,
            ))
            .wrap(auth::AuthMiddleware)
            .configure(blacklist::routes)
            .configure(children::routes)
            .configure(counter::routes)
            .configure(districts::routes)
            .configure(g1_applications::routes)
            .configure(enrollment_batches::routes)
            .configure(guardians::routes)
            .configure(addresses::routes)
            .configure(past_pupil_details::routes)
            .configure(schools::routes)
            .configure(staff_details::routes)
            .configure(students::routes)
            .configure(workspace_addresses::routes)
            .configure(uploads::routes)
            .service(web::scope("/auth").configure(auth::routes)),
    );
}
