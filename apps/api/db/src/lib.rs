pub mod entity;
pub mod rbac;
pub mod seed;

use sea_orm::{Database, DatabaseConnection, DbErr};

#[derive(Clone)]
pub struct DatabaseConfig {
    pub host: String,
    pub port: String,
    pub username: String,
    pub password: String,
    pub database: String,
}

impl DatabaseConfig {
    pub fn url(&self) -> String {
        format!(
            "postgres://{}:{}@{}:{}/{}",
            self.username, self.password, self.host, self.port, self.database
        )
    }
}

pub async fn get_connection(config: DatabaseConfig) -> Result<DatabaseConnection, DbErr> {
    let database_url = config.url();
    Database::connect(database_url).await
}
