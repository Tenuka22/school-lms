use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::common::blacklist;

#[async_trait]
pub trait BlacklistRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<blacklist::Model>, DbErr>;
    async fn find_active(&self) -> Result<Vec<blacklist::Model>, DbErr>;
    async fn find_by_guardian(&self, guardian_id: Uuid) -> Result<Vec<blacklist::Model>, DbErr>;
    async fn insert(&self, model: blacklist::Model) -> Result<blacklist::Model, DbErr>;
    async fn update(&self, model: blacklist::Model) -> Result<blacklist::Model, DbErr>;
    async fn list(&self) -> Result<Vec<blacklist::Model>, DbErr>;
}

pub struct SeaOrmBlacklistRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> BlacklistRepo for SeaOrmBlacklistRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<blacklist::Model>, DbErr> {
        use sea_orm::EntityTrait;
        blacklist::Entity::find_by_id(id).one(self.db).await
    }

    async fn find_active(&self) -> Result<Vec<blacklist::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        blacklist::Entity::find()
            .filter(blacklist::Column::Status.eq("Active"))
            .all(self.db)
            .await
    }

    async fn find_by_guardian(&self, guardian_id: Uuid) -> Result<Vec<blacklist::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        blacklist::Entity::find()
            .filter(blacklist::Column::GuardianId.eq(guardian_id))
            .all(self.db)
            .await
    }

    async fn insert(&self, model: blacklist::Model) -> Result<blacklist::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: blacklist::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn update(&self, model: blacklist::Model) -> Result<blacklist::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: blacklist::ActiveModel = model.into();
        active.update(self.db).await
    }

    async fn list(&self) -> Result<Vec<blacklist::Model>, DbErr> {
        use sea_orm::EntityTrait;
        blacklist::Entity::find().all(self.db).await
    }
}
