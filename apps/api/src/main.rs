mod config;

use actix_web::middleware::Logger;
use actix_web::{App, HttpServer, web};
use dotenvy::from_filename;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    from_filename(".env.local")
        .or_else(|_| from_filename(".env.production"))
        .ok();
    env_logger::init();

    let cfg = config::Config::from_env().unwrap_or_else(|e| {
        log::error!("Failed to load configuration: {e}");
        std::process::exit(1);
    });

    log::info!("Configuration loaded: {cfg}");

    let db_cfg = db::DatabaseConfig {
        host: cfg.postgres_host.clone(),
        port: cfg.postgres_port.to_string(),
        username: cfg.postgres_user.clone(),
        password: cfg.password().to_string(),
        database: cfg.postgres_database.clone(),
    };

    let db = db::get_connection(db_cfg)
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
