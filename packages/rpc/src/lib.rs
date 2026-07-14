use actix_web::web;

mod handlers;

pub fn router() -> actix_web::Scope {
    web::scope("/rpc")
        .route("/hello", web::get().to(handlers::hello))
}
