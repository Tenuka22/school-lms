pub mod handlers;

use apistos::web;

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/schools", web::get().to(handlers::list::list_schools));
}
