mod config;

use actix_cors::Cors;
use actix_web::middleware::Logger;
use actix_web::{App, HttpServer, web};
use apistos::{ApiComponent, ScalarConfig};
use apistos::app::{BuildConfig, OpenApiWrapper};
use apistos::info::Info;
use apistos::spec::{DefaultParameters, Spec};
use dotenvy::from_filename;
use rest::error::ErrorResponse;
use rest::JwtSecret;
use rest::storage::Storage;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
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

    db::migrate(&db).await.expect("Schema migration failed");

    if let Err(e) = db::rbac::seed_defaults(&db).await {
        log::warn!("RBAC seeding failed: {e}");
    }

    if let Err(e) = db::seed::seed_districts(&db).await {
        log::warn!("District seeding failed (continuing): {e}");
    }

    if let Err(e) = db::seed::seed_schools(&db).await {
        log::warn!("School seeding failed (continuing): {e}");
    }

    if let Err(e) = db::seed::seed_workspace_addresses(&db).await {
        log::warn!("Workspace address seeding failed (continuing): {e}");
    }

    let storage = Storage::from_env().await;
    if let Err(e) = storage.ensure_bucket().await {
        log::warn!("MinIO bucket setup failed (continuing): {e}");
    }

    let jwt_secret = cfg.jwt_secret.clone();
    let jwt_data = web::Data::new(JwtSecret(jwt_secret.clone()));
    let data = web::Data::new(db.clone());
    let storage_data = web::Data::new(storage);

    let port = cfg.server_port;
    let frontend_url = cfg.frontend_url.clone();
    log::info!("Starting server on 0.0.0.0:{port} with allowed origin: {frontend_url}");

    HttpServer::new(move || {
        let mut spec = Spec {
            info: Info {
                title: "School LMS API".to_string(),
                version: "0.1.0".to_string(),
                description: Some("School Learning Management System API".to_string()),
                ..Default::default()
            },
            ..Default::default()
        };

        if let Some(error_schema) = <ErrorResponse as ApiComponent>::schema() {
            spec.default_parameters.push(DefaultParameters {
                components: vec![error_schema],
                ..Default::default()
            });
        }

        let cors = Cors::default()
            .allowed_origin(&frontend_url)
            .allowed_methods(vec!["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                actix_web::http::header::AUTHORIZATION,
                actix_web::http::header::CONTENT_TYPE,
            ])
            .supports_credentials()
            .max_age(3600);

        App::new()
            .document(spec)
            .wrap(Logger::default())
            .wrap(cors)
            .app_data(data.clone())
            .app_data(jwt_data.clone())
            .app_data(storage_data.clone())
            .configure(rest::configure)
            .build_with(
                "/openapi.json",
                BuildConfig::default().with(ScalarConfig::new(&"/docs")),
            )
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
