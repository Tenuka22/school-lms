pub mod handlers;

use apistos::web;

use handlers::{create, get, list, update};

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/children", web::get().to(list::list_children))
        .route("/children", web::post().to(create::create_child))
        .route("/children/{id}", web::get().to(get::get_child))
        .route("/children/{id}", web::put().to(update::update_child));
}
