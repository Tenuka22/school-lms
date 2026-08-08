pub mod handlers;

use apistos::web;

use handlers::{create_student, list, update_student};

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/students", web::get().to(list::list_students))
        .route("/students", web::post().to(create_student::create_student))
        .route(
            "/students/{id}",
            web::put().to(update_student::update_student),
        );
}
