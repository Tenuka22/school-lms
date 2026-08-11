pub mod handlers;

use apistos::web;

use handlers::{create, list};

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route(
        "/past-pupil-details",
        web::get().to(list::list_past_pupil_details),
    )
    .route(
        "/past-pupil-details",
        web::post().to(create::create_past_pupil_detail),
    );
}
