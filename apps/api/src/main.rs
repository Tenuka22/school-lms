use actix_web::{App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().service(rpc::router()))
        .bind(("0.0.0.0", 3001))?
        .run()
        .await
}
