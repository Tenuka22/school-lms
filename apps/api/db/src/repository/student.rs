use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::student::student;

#[async_trait]
pub trait StudentRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<student::Model>, DbErr>;
    async fn find_by_child(&self, child_id: Uuid) -> Result<Option<student::Model>, DbErr>;
    async fn insert(&self, model: student::Model) -> Result<student::Model, DbErr>;
    async fn update(&self, model: student::Model) -> Result<student::Model, DbErr>;
    async fn list_with_children(
        &self,
        search: Option<&str>,
        status: Option<&str>,
    ) -> Result<Vec<(student::Model, crate::entity::g1::children::Model)>, DbErr>;
}

pub struct SeaOrmStudentRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> StudentRepo for SeaOrmStudentRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<student::Model>, DbErr> {
        use sea_orm::EntityTrait;
        student::Entity::find_by_id(id).one(self.db).await
    }

    async fn find_by_child(&self, child_id: Uuid) -> Result<Option<student::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        student::Entity::find()
            .filter(student::Column::ChildId.eq(child_id))
            .one(self.db)
            .await
    }

    async fn insert(&self, model: student::Model) -> Result<student::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: student::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn update(&self, model: student::Model) -> Result<student::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: student::ActiveModel = model.into();
        active.update(self.db).await
    }

    async fn list_with_children(
        &self,
        search: Option<&str>,
        status: Option<&str>,
    ) -> Result<Vec<(student::Model, crate::entity::g1::children::Model)>, DbErr> {
        use crate::entity::g1::children;
        use sea_orm::{ColumnTrait, Condition, EntityTrait, QueryFilter};

        let mut q = student::Entity::find().find_with_related(children::Entity);

        if let Some(search) = search {
            let pattern = format!("%{}%", search);
            q = q.filter(
                Condition::any()
                    .add(children::Column::FullName.ilike(&pattern))
                    .add(children::Column::AdmissionNumber.ilike(&pattern)),
            );
        }

        if let Some(status) = status {
            let statuses: Vec<crate::entity::common::enums::StudentStatus> = status
                .split(',')
                .filter_map(|s| match s.trim() {
                    "Active" => Some(crate::entity::common::enums::StudentStatus::Active),
                    "Graduated" => Some(crate::entity::common::enums::StudentStatus::Graduated),
                    "Removed" => Some(crate::entity::common::enums::StudentStatus::Removed),
                    _ => None,
                })
                .collect();
            if !statuses.is_empty() {
                q = q.filter(children::Column::Status.is_in(statuses));
            }
        }

        let results = q.all(self.db).await?;
        let flat: Vec<(student::Model, children::Model)> = results
            .into_iter()
            .filter_map(|(s, cs)| cs.into_iter().next().map(|c| (s, c)))
            .collect();
        Ok(flat)
    }
}
