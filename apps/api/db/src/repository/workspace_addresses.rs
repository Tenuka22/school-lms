use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::common::workspace_addresses;

#[async_trait]
pub trait WorkspaceAddressRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<workspace_addresses::Model>, DbErr>;
    async fn insert(&self, model: workspace_addresses::Model) -> Result<workspace_addresses::Model, DbErr>;
    async fn list(&self) -> Result<Vec<workspace_addresses::Model>, DbErr>;
    async fn find_by_search(&self, search: &str) -> Result<Vec<workspace_addresses::Model>, DbErr>;
}

pub struct SeaOrmWorkspaceAddressRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> WorkspaceAddressRepo for SeaOrmWorkspaceAddressRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<workspace_addresses::Model>, DbErr> {
        use sea_orm::EntityTrait;
        workspace_addresses::Entity::find_by_id(id).one(self.db).await
    }

    async fn insert(&self, model: workspace_addresses::Model) -> Result<workspace_addresses::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: workspace_addresses::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn list(&self) -> Result<Vec<workspace_addresses::Model>, DbErr> {
        use sea_orm::EntityTrait;
        workspace_addresses::Entity::find().all(self.db).await
    }

    async fn find_by_search(&self, search: &str) -> Result<Vec<workspace_addresses::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        let pattern = format!("%{}%", search);
        workspace_addresses::Entity::find()
            .filter(workspace_addresses::Column::Name.ilike(&pattern))
            .all(self.db)
            .await
    }
}
