use actix_web::web;

mod hello;

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/hello", web::get().to(hello::hello));
}