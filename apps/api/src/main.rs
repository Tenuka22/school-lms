mod config;

use actix_web::middleware::Logger;
use actix_web::{App, HttpServer, web};
use dotenvy::from_filename;
use rest::JwtSecret;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    from_filename(".env").ok();
    from_filename(".env.local").ok();
    from_filename(".env.production").ok();
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

    let db = {
        let mut attempt = 0;
        loop {
            match db::get_connection(db_cfg.clone()).await {
                Ok(d) => break d,
                Err(e) => {
                    if attempt >= 10 {
                        panic!("Database connection failed after retries: {e}");
                    }
                    log::warn!("DB connection attempt {attempt} failed: {e}; retrying in 2s");
                    attempt += 1;
                    actix_web::rt::time::sleep(std::time::Duration::from_secs(2)).await;
                }
            }
        }
    };

    db.get_schema_registry("db::entity::*")
        .sync(&db)
        .await
        .expect("Schema sync failed");

    if let Err(e) = db::rbac::seed_defaults(&db).await {
        log::warn!("RBAC seeding failed: {e}");
    }

    let jwt_secret = cfg.jwt_secret.clone();
    let jwt_data = web::Data::new(JwtSecret(jwt_secret.clone()));
    let data = web::Data::new(db.clone());

    let port = cfg.server_port;
    log::info!("Starting server on 0.0.0.0:{port}");

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(data.clone())
            .app_data(jwt_data.clone())
            .configure(rest::configure)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
