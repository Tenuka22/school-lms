use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};

use crate::entity::common::secure_counter;

#[async_trait]
pub trait SecureCounterRepo: Send + Sync {
    async fn find_by_name(&self, name: &str) -> Result<Option<secure_counter::Model>, DbErr>;
    async fn insert(&self, model: secure_counter::Model) -> Result<secure_counter::Model, DbErr>;
    async fn update(&self, model: secure_counter::Model) -> Result<secure_counter::Model, DbErr>;
}

pub struct SeaOrmSecureCounterRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> SecureCounterRepo for SeaOrmSecureCounterRepo<'a> {
    async fn find_by_name(&self, name: &str) -> Result<Option<secure_counter::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        secure_counter::Entity::find()
            .filter(secure_counter::Column::Name.eq(name))
            .one(self.db)
            .await
    }

    async fn insert(&self, model: secure_counter::Model) -> Result<secure_counter::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: secure_counter::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn update(&self, model: secure_counter::Model) -> Result<secure_counter::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: secure_counter::ActiveModel = model.into();
        active.update(self.db).await
    }
}
