use actix_web::web;

mod routes;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/rpc")
            .configure(routes::root::routes),
    );
}