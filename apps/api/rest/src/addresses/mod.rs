pub mod handlers;

use apistos::web;

use handlers::{create, get, list};

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/addresses", web::get().to(list::list_addresses))
        .route("/addresses/{id}", web::get().to(get::get_address))
        .route("/addresses", web::post().to(create::create_address));
}
