use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::common::past_pupil_details;

#[async_trait]
pub trait PastPupilDetailRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<past_pupil_details::Model>, DbErr>;
    async fn find_by_guardian(&self, guardian_id: Uuid) -> Result<Vec<past_pupil_details::Model>, DbErr>;
    async fn insert(&self, model: past_pupil_details::Model) -> Result<past_pupil_details::Model, DbErr>;
    async fn update(&self, model: past_pupil_details::Model) -> Result<past_pupil_details::Model, DbErr>;
    async fn delete_by_guardian(&self, guardian_id: Uuid) -> Result<(), DbErr>;
}

pub struct SeaOrmPastPupilDetailRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> PastPupilDetailRepo for SeaOrmPastPupilDetailRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<past_pupil_details::Model>, DbErr> {
        use sea_orm::EntityTrait;
        past_pupil_details::Entity::find_by_id(id).one(self.db).await
    }

    async fn find_by_guardian(&self, guardian_id: Uuid) -> Result<Vec<past_pupil_details::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        past_pupil_details::Entity::find()
            .filter(past_pupil_details::Column::GuardianId.eq(guardian_id))
            .all(self.db)
            .await
    }

    async fn insert(&self, model: past_pupil_details::Model) -> Result<past_pupil_details::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: past_pupil_details::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn update(&self, model: past_pupil_details::Model) -> Result<past_pupil_details::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: past_pupil_details::ActiveModel = model.into();
        active.update(self.db).await
    }

    async fn delete_by_guardian(&self, guardian_id: Uuid) -> Result<(), DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        past_pupil_details::Entity::delete_many()
            .filter(past_pupil_details::Column::GuardianId.eq(guardian_id))
            .exec(self.db)
            .await?;
        Ok(())
    }
}
