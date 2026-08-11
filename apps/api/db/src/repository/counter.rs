use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};

use crate::entity::common::counter;

#[async_trait]
pub trait CounterRepo: Send + Sync {
    async fn find_by_name(&self, name: &str) -> Result<Option<counter::Model>, DbErr>;
    async fn insert(&self, model: counter::Model) -> Result<counter::Model, DbErr>;
    async fn update(&self, model: counter::Model) -> Result<counter::Model, DbErr>;
}

pub struct SeaOrmCounterRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> CounterRepo for SeaOrmCounterRepo<'a> {
    async fn find_by_name(&self, name: &str) -> Result<Option<counter::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        counter::Entity::find()
            .filter(counter::Column::Name.eq(name))
            .one(self.db)
            .await
    }

    async fn insert(&self, model: counter::Model) -> Result<counter::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: counter::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn update(&self, model: counter::Model) -> Result<counter::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: counter::ActiveModel = model.into();
        active.update(self.db).await
    }
}
