pub mod handlers;

use apistos::web;

use handlers::{create, delete, get, list, update};

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/g1-applications", web::get().to(list::list_applications))
        .route("/g1-applications/{id}", web::get().to(get::get_application))
        .route("/g1-applications", web::post().to(create::create_application))
        .route("/g1-applications/{id}", web::put().to(update::update_application))
        .route("/g1-applications/{id}", web::delete().to(delete::delete_application))
        .route(
            "/g1-applications/{id}/submit",
            web::post().to(create::submit_application),
        )
        .route(
            "/g1-applications/{id}/calculate-marks",
            web::post().to(create::calculate_marks),
        )
        .route(
            "/g1-applications/generate-lists",
            web::post().to(create::generate_admission_lists),
        );
}
