use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::common::schools;

#[async_trait]
pub trait SchoolRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<schools::Model>, DbErr>;
    async fn list(&self) -> Result<Vec<schools::Model>, DbErr>;
    async fn find_by_search(&self, search: &str) -> Result<Vec<schools::Model>, DbErr>;
}

pub struct SeaOrmSchoolRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> SchoolRepo for SeaOrmSchoolRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<schools::Model>, DbErr> {
        use sea_orm::EntityTrait;
        schools::Entity::find_by_id(id).one(self.db).await
    }

    async fn list(&self) -> Result<Vec<schools::Model>, DbErr> {
        use sea_orm::EntityTrait;
        schools::Entity::find().all(self.db).await
    }

    async fn find_by_search(&self, search: &str) -> Result<Vec<schools::Model>, DbErr> {
        use sea_orm::{ColumnTrait, Condition, EntityTrait, QueryFilter};
        let pattern = format!("%{}%", search);
        schools::Entity::find()
            .filter(
                Condition::any()
                    .add(schools::Column::SchoolNameSi.ilike(&pattern))
                    .add(schools::Column::SchoolNameEn.ilike(&pattern)),
            )
            .all(self.db)
            .await
    }
}
