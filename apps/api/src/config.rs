use std::env;
use std::fmt;

#[derive(Clone)]
pub struct Config {
    pub postgres_host: String,
    pub postgres_port: u16,
    pub postgres_user: String,
    postgres_password: String,
    pub postgres_database: String,
    pub server_port: u16,
    pub jwt_secret: String,
    pub frontend_url: String,
    pub public_url: Option<String>,
    pub minio_endpoint: String,
    pub minio_access_key: String,
    #[allow(dead_code)]
    minio_secret_key: String,
    pub minio_bucket: String,
    pub minio_region: String,
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        Ok(Self {
            postgres_host: env::var("POSTGRES_HOST").map_err(|_| "POSTGRES_HOST must be set")?,
            postgres_port: env::var("POSTGRES_PORT")
                .map_err(|_| "POSTGRES_PORT must be set")?
                .parse()
                .map_err(|e| format!("POSTGRES_PORT is not a valid port: {e}"))?,
            postgres_user: env::var("POSTGRES_USER").map_err(|_| "POSTGRES_USER must be set")?,
            postgres_password: env::var("POSTGRES_PASSWORD")
                .map_err(|_| "POSTGRES_PASSWORD must be set")?,
            postgres_database: env::var("POSTGRES_DB").map_err(|_| "POSTGRES_DB must be set")?,
            server_port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8001".into())
                .parse()
                .map_err(|e| format!("SERVER_PORT is not a valid port: {e}"))?,
            jwt_secret: env::var("JWT_SECRET")
                .map_err(|_| "JWT_SECRET must be set (add to .env file)")?,
            frontend_url: env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:8000".into()),
            public_url: env::var("PUBLIC_URL").ok(),
            minio_endpoint: env::var("MINIO_ENDPOINT")
                .unwrap_or_else(|_| "http://localhost:9000".into()),
            minio_access_key: env::var("MINIO_ACCESS_KEY").unwrap_or_else(|_| "minioadmin".into()),
            minio_secret_key: env::var("MINIO_SECRET_KEY").unwrap_or_else(|_| "minioadmin".into()),
            minio_bucket: env::var("MINIO_BUCKET").unwrap_or_else(|_| "school-lms".into()),
            minio_region: env::var("MINIO_REGION").unwrap_or_else(|_| "us-east-1".into()),
        })
    }

    pub fn password(&self) -> &str {
        &self.postgres_password
    }
}

impl fmt::Display for Config {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Config")
            .field("postgres_host", &self.postgres_host)
            .field("postgres_port", &self.postgres_port)
            .field("postgres_user", &self.postgres_user)
            .field("postgres_password", &"****")
            .field("postgres_database", &self.postgres_database)
            .field("server_port", &self.server_port)
            .field("jwt_secret", &"****")
            .field("frontend_url", &self.frontend_url)
            .field("public_url", &self.public_url.as_deref().unwrap_or("not set"))
            .field("minio_endpoint", &self.minio_endpoint)
            .field("minio_access_key", &self.minio_access_key)
            .field("minio_bucket", &self.minio_bucket)
            .field("minio_region", &self.minio_region)
            .finish()
    }
}
