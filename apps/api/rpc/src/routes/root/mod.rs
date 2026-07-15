use actix_web::web;

mod counter;
mod hello;

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/hello", web::get().to(hello::hello))
        .route("/counter/{name}", web::get().to(counter::get_counter))
        .route(
            "/counter/{name}/increment",
            web::get().to(counter::increment_counter),
        );
}
