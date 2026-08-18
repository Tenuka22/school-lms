use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::common::enrollment_batches;

#[async_trait]
pub trait EnrollmentBatchRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<enrollment_batches::Model>, DbErr>;
    async fn find_by_batch_code(
        &self,
        code: &str,
    ) -> Result<Option<enrollment_batches::Model>, DbErr>;
    async fn insert(
        &self,
        model: enrollment_batches::Model,
    ) -> Result<enrollment_batches::Model, DbErr>;
    async fn update(
        &self,
        model: enrollment_batches::Model,
    ) -> Result<enrollment_batches::Model, DbErr>;
    async fn delete(&self, id: Uuid) -> Result<(), DbErr>;
    async fn list(&self) -> Result<Vec<enrollment_batches::Model>, DbErr>;
}

pub struct SeaOrmEnrollmentBatchRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> EnrollmentBatchRepo for SeaOrmEnrollmentBatchRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<enrollment_batches::Model>, DbErr> {
        use sea_orm::EntityTrait;
        enrollment_batches::Entity::find_by_id(id)
            .one(self.db)
            .await
    }

    async fn find_by_batch_code(
        &self,
        code: &str,
    ) -> Result<Option<enrollment_batches::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        enrollment_batches::Entity::find()
            .filter(enrollment_batches::Column::BatchCode.eq(code))
            .one(self.db)
            .await
    }

    async fn insert(
        &self,
        model: enrollment_batches::Model,
    ) -> Result<enrollment_batches::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: enrollment_batches::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn update(
        &self,
        model: enrollment_batches::Model,
    ) -> Result<enrollment_batches::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: enrollment_batches::ActiveModel = model.into();
        active.update(self.db).await
    }

    async fn delete(&self, id: Uuid) -> Result<(), DbErr> {
        use sea_orm::{ActiveModelTrait, EntityTrait};
        let model = enrollment_batches::Entity::find_by_id(id)
            .one(self.db)
            .await?;
        if let Some(m) = model {
            let active: enrollment_batches::ActiveModel = m.into();
            active.delete(self.db).await?;
        }
        Ok(())
    }

    async fn list(&self) -> Result<Vec<enrollment_batches::Model>, DbErr> {
        use sea_orm::EntityTrait;
        enrollment_batches::Entity::find().all(self.db).await
    }
}
