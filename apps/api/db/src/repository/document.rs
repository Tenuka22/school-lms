use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::g1::documents;

#[async_trait]
pub trait DocumentRepo: Send + Sync {
    async fn find_by_application(&self, app_id: Uuid) -> Result<Vec<documents::Model>, DbErr>;
    async fn insert_many(&self, models: Vec<documents::Model>) -> Result<Vec<documents::Model>, DbErr>;
    async fn delete_by_application(&self, app_id: Uuid) -> Result<(), DbErr>;
}

pub struct SeaOrmDocumentRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> DocumentRepo for SeaOrmDocumentRepo<'a> {
    async fn find_by_application(&self, app_id: Uuid) -> Result<Vec<documents::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        documents::Entity::find()
            .filter(documents::Column::ApplicationId.eq(app_id))
            .all(self.db)
            .await
    }

    async fn insert_many(&self, models: Vec<documents::Model>) -> Result<Vec<documents::Model>, DbErr> {
        use sea_orm::ActiveModelTrait;
        let mut results = Vec::with_capacity(models.len());
        for model in models {
            let active: documents::ActiveModel = model.into();
            results.push(active.insert(self.db).await?);
        }
        Ok(results)
    }

    async fn delete_by_application(&self, app_id: Uuid) -> Result<(), DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        documents::Entity::delete_many()
            .filter(documents::Column::ApplicationId.eq(app_id))
            .exec(self.db)
            .await?;
        Ok(())
    }
}
