pub mod handlers;

use apistos::web;

use handlers::{create, list};

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/staff-details", web::get().to(list::list_staff_details))
        .route("/staff-details", web::post().to(create::create_staff_detail));
}
