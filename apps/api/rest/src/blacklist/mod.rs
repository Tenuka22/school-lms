mod handlers;

use apistos::web;

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/blacklist", web::get().to(handlers::list::list_blacklist));
}
