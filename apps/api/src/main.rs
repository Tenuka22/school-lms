use actix_web::{App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().configure(rpc::configure))
        .bind(("0.0.0.0", 3001))?
        .run()
        .await
}
