pub mod handlers;

use apistos::web;

use handlers::{create, get, list, update};

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/guardians", web::get().to(list::list_guardians))
        .route("/guardians/{id}", web::get().to(get::get_guardian))
        .route("/guardians", web::post().to(create::create_guardian))
        .route("/guardians/{id}", web::put().to(update::update_guardian));
}
