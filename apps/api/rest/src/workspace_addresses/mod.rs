pub mod handlers;

use apistos::web;

use handlers::{create, get, list};

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/workspace-addresses", web::get().to(list::list_workspace_addresses))
        .route("/workspace-addresses/{id}", web::get().to(get::get_workspace_address))
        .route("/workspace-addresses", web::post().to(create::create_workspace_address));
}
