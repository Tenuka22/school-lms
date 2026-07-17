pub mod handlers;

use actix_web::web;

use handlers::{create, delete, get, list, update};

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/g1-enrollments", web::get().to(list::list_enrollments))
        .route("/g1-enrollments/{id}", web::get().to(get::get_enrollment))
        .route("/g1-enrollments", web::post().to(create::create_enrollment))
        .route("/g1-enrollments/{id}", web::put().to(update::update_enrollment))
        .route("/g1-enrollments/{id}", web::delete().to(delete::delete_enrollment));
}
