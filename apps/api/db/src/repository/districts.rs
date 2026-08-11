use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::common::districts;

#[async_trait]
pub trait DistrictRepo: Send + Sync {
    async fn list(&self) -> Result<Vec<districts::Model>, DbErr>;
    async fn find_by_id(&self, id: Uuid) -> Result<Option<districts::Model>, DbErr>;
}

pub struct SeaOrmDistrictRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> DistrictRepo for SeaOrmDistrictRepo<'a> {
    async fn list(&self) -> Result<Vec<districts::Model>, DbErr> {
        use sea_orm::EntityTrait;
        districts::Entity::find().all(self.db).await
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<districts::Model>, DbErr> {
        use sea_orm::EntityTrait;
        districts::Entity::find_by_id(id).one(self.db).await
    }
}
