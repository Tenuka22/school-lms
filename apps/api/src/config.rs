use std::env;
use std::fmt;

#[derive(Clone)]
pub struct Config {
    pub postgres_host: String,
    pub postgres_port: u16,
    pub postgres_user: String,
    postgres_password: String,
    pub postgres_database: String,
    pub rust_log: String,
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
            rust_log: env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
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
            .field("rust_log", &self.rust_log)
            .finish()
    }
}
