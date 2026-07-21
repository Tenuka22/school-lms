pub mod handlers;

use apistos::web;

use handlers::{create, delete, get, list, update};

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/enrollment-batches", web::get().to(list::list_batches))
        .route("/enrollment-batches/{id}", web::get().to(get::get_batch))
        .route("/enrollment-batches", web::post().to(create::create_batch))
        .route(
            "/enrollment-batches/{id}",
            web::put().to(update::update_batch),
        )
        .route(
            "/enrollment-batches/{id}",
            web::delete().to(delete::delete_batch),
        );
}
