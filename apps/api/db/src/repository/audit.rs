use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};

use crate::entity::audit_logs;

#[async_trait]
pub trait AuditRepo: Send + Sync {
    async fn insert(&self, model: audit_logs::Model) -> Result<audit_logs::Model, DbErr>;
}

pub struct SeaOrmAuditRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> AuditRepo for SeaOrmAuditRepo<'a> {
    async fn insert(&self, model: audit_logs::Model) -> Result<audit_logs::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: audit_logs::ActiveModel = model.into();
        active.insert(self.db).await
    }
}
