use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::common::addresses;

#[async_trait]
pub trait AddressRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<addresses::Model>, DbErr>;
    async fn insert(&self, model: addresses::Model) -> Result<addresses::Model, DbErr>;
    async fn list(&self) -> Result<Vec<addresses::Model>, DbErr>;
}

pub struct SeaOrmAddressRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> AddressRepo for SeaOrmAddressRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<addresses::Model>, DbErr> {
        use sea_orm::EntityTrait;
        addresses::Entity::find_by_id(id).one(self.db).await
    }

    async fn insert(&self, model: addresses::Model) -> Result<addresses::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: addresses::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn list(&self) -> Result<Vec<addresses::Model>, DbErr> {
        use sea_orm::EntityTrait;
        addresses::Entity::find().all(self.db).await
    }
}
