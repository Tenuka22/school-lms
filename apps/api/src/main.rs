use actix_web::middleware::Logger;
use actix_web::{App, HttpServer, web};
use dotenvy::from_filename;
use std::env;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    from_filename(".env.local").or_else(|_| from_filename(".env.production")).ok();
    env_logger::init();

    log::info!("Logger initialized");

    let config = db::DatabaseConfig {
        host: env::var("POSTGRES_HOST").expect("POSTGRES_HOST missing"),

        port: env::var("POSTGRES_PORT").expect("POSTGRES_PORT missing"),

        username: env::var("POSTGRES_USER").expect("POSTGRES_USER missing"),

        password: env::var("POSTGRES_PASSWORD").expect("POSTGRES_PASSWORD missing"),

        database: env::var("POSTGRES_DB").expect("POSTGRES_DB missing"),
    };

    let db = db::get_connection(config)
        .await
        .expect("Database connection failed");

    db.get_schema_registry("db::entity::*")
        .sync(&db)
        .await
        .expect("Schema sync failed");

    log::info!("Starting server on 0.0.0.0:3001");

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(db.clone()))
            .configure(rpc::configure)
    })
    .bind(("0.0.0.0", 3001))?
    .run()
    .await
}
