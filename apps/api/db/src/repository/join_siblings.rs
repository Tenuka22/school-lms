use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::g1::join_siblings;

#[async_trait]
pub trait JoinSiblingsRepo: Send + Sync {
    async fn find_by_application(&self, app_id: Uuid) -> Result<Vec<join_siblings::Model>, DbErr>;
    async fn delete_by_application(&self, app_id: Uuid) -> Result<(), DbErr>;
    async fn insert_many(
        &self,
        models: Vec<join_siblings::Model>,
    ) -> Result<Vec<join_siblings::Model>, DbErr>;
}

pub struct SeaOrmJoinSiblingsRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> JoinSiblingsRepo for SeaOrmJoinSiblingsRepo<'a> {
    async fn find_by_application(&self, app_id: Uuid) -> Result<Vec<join_siblings::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        join_siblings::Entity::find()
            .filter(join_siblings::Column::ApplicationId.eq(app_id))
            .all(self.db)
            .await
    }

    async fn delete_by_application(&self, app_id: Uuid) -> Result<(), DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        join_siblings::Entity::delete_many()
            .filter(join_siblings::Column::ApplicationId.eq(app_id))
            .exec(self.db)
            .await?;
        Ok(())
    }

    async fn insert_many(
        &self,
        models: Vec<join_siblings::Model>,
    ) -> Result<Vec<join_siblings::Model>, DbErr> {
        use sea_orm::ActiveModelTrait;
        let mut results = Vec::with_capacity(models.len());
        for model in models {
            let active: join_siblings::ActiveModel = model.into();
            results.push(active.insert(self.db).await?);
        }
        Ok(results)
    }
}
