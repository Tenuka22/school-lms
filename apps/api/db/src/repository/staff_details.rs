use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::common::staff_details;

#[async_trait]
pub trait StaffDetailRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<staff_details::Model>, DbErr>;
    async fn find_by_guardian(&self, guardian_id: Uuid)
    -> Result<Vec<staff_details::Model>, DbErr>;
    async fn insert(&self, model: staff_details::Model) -> Result<staff_details::Model, DbErr>;
    async fn update(&self, model: staff_details::Model) -> Result<staff_details::Model, DbErr>;
    async fn delete_by_guardian(&self, guardian_id: Uuid) -> Result<(), DbErr>;
}

pub struct SeaOrmStaffDetailRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> StaffDetailRepo for SeaOrmStaffDetailRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<staff_details::Model>, DbErr> {
        use sea_orm::EntityTrait;
        staff_details::Entity::find_by_id(id).one(self.db).await
    }

    async fn find_by_guardian(
        &self,
        guardian_id: Uuid,
    ) -> Result<Vec<staff_details::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        staff_details::Entity::find()
            .filter(staff_details::Column::GuardianId.eq(guardian_id))
            .all(self.db)
            .await
    }

    async fn insert(&self, model: staff_details::Model) -> Result<staff_details::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: staff_details::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn update(&self, model: staff_details::Model) -> Result<staff_details::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: staff_details::ActiveModel = model.into();
        active.update(self.db).await
    }

    async fn delete_by_guardian(&self, guardian_id: Uuid) -> Result<(), DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        staff_details::Entity::delete_many()
            .filter(staff_details::Column::GuardianId.eq(guardian_id))
            .exec(self.db)
            .await?;
        Ok(())
    }
}
