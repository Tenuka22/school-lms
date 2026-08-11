use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::common::siblings;

#[async_trait]
pub trait SiblingRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<siblings::Model>, DbErr>;
    async fn find_by_student_and_school(
        &self,
        student_id: Uuid,
        school_id: Uuid,
    ) -> Result<Option<siblings::Model>, DbErr>;
    async fn insert(&self, model: siblings::Model) -> Result<siblings::Model, DbErr>;
    async fn find_by_ids(&self, ids: &[Uuid]) -> Result<Vec<siblings::Model>, DbErr>;
}

pub struct SeaOrmSiblingRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> SiblingRepo for SeaOrmSiblingRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<siblings::Model>, DbErr> {
        use sea_orm::EntityTrait;
        siblings::Entity::find_by_id(id).one(self.db).await
    }

    async fn find_by_student_and_school(
        &self,
        student_id: Uuid,
        school_id: Uuid,
    ) -> Result<Option<siblings::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        siblings::Entity::find()
            .filter(siblings::Column::StudentId.eq(student_id))
            .filter(siblings::Column::SchoolId.eq(school_id))
            .one(self.db)
            .await
    }

    async fn insert(&self, model: siblings::Model) -> Result<siblings::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: siblings::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn find_by_ids(&self, ids: &[Uuid]) -> Result<Vec<siblings::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        siblings::Entity::find()
            .filter(siblings::Column::Id.is_in(ids.to_vec()))
            .all(self.db)
            .await
    }
}
