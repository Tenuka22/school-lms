use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::common::guardians;

#[async_trait]
pub trait GuardianRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<guardians::Model>, DbErr>;
    async fn find_by_nic(&self, nic: &str) -> Result<Option<guardians::Model>, DbErr>;
    async fn insert(&self, model: guardians::Model) -> Result<guardians::Model, DbErr>;
    async fn update(&self, model: guardians::Model) -> Result<guardians::Model, DbErr>;
    async fn find_by_ids(&self, ids: &[Uuid]) -> Result<Vec<guardians::Model>, DbErr>;
    async fn list(&self) -> Result<Vec<guardians::Model>, DbErr>;
}

pub struct SeaOrmGuardianRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> GuardianRepo for SeaOrmGuardianRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<guardians::Model>, DbErr> {
        use sea_orm::EntityTrait;
        guardians::Entity::find_by_id(id).one(self.db).await
    }

    async fn find_by_nic(&self, nic: &str) -> Result<Option<guardians::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        guardians::Entity::find()
            .filter(guardians::Column::NicNumber.eq(nic))
            .one(self.db)
            .await
    }

    async fn insert(&self, model: guardians::Model) -> Result<guardians::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: guardians::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn update(&self, model: guardians::Model) -> Result<guardians::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: guardians::ActiveModel = model.into();
        active.update(self.db).await
    }

    async fn find_by_ids(&self, ids: &[Uuid]) -> Result<Vec<guardians::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        guardians::Entity::find()
            .filter(guardians::Column::Id.is_in(ids.to_vec()))
            .all(self.db)
            .await
    }

    async fn list(&self) -> Result<Vec<guardians::Model>, DbErr> {
        use sea_orm::EntityTrait;
        guardians::Entity::find().all(self.db).await
    }
}
