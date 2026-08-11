use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::g1::children;

#[async_trait]
pub trait ChildRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<children::Model>, DbErr>;
    async fn insert(&self, model: children::Model) -> Result<children::Model, DbErr>;
    async fn update(&self, model: children::Model) -> Result<children::Model, DbErr>;
    async fn find_by_birth_certificate(&self, bc: &str) -> Result<Option<children::Model>, DbErr>;
    async fn find_by_nic(&self, nic: &str) -> Result<Option<children::Model>, DbErr>;
    async fn find_duplicates(
        &self,
        name: &str,
        name_initials: &str,
        bc: Option<&str>,
        nic: Option<&str>,
    ) -> Result<Vec<children::Model>, DbErr>;
    async fn list(
        &self,
        search: Option<&str>,
        bc: Option<&str>,
        nic: Option<&str>,
        name: Option<&str>,
        has_student: Option<bool>,
    ) -> Result<Vec<children::Model>, DbErr>;
}

pub struct SeaOrmChildRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> ChildRepo for SeaOrmChildRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<children::Model>, DbErr> {
        use sea_orm::EntityTrait;
        children::Entity::find_by_id(id).one(self.db).await
    }

    async fn insert(&self, model: children::Model) -> Result<children::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: children::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn update(&self, model: children::Model) -> Result<children::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: children::ActiveModel = model.into();
        active.update(self.db).await
    }

    async fn find_by_birth_certificate(&self, bc: &str) -> Result<Option<children::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        children::Entity::find()
            .filter(children::Column::BirthCertificateNumber.eq(bc))
            .one(self.db)
            .await
    }

    async fn find_by_nic(&self, nic: &str) -> Result<Option<children::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        children::Entity::find()
            .filter(children::Column::Nic.eq(nic))
            .one(self.db)
            .await
    }

    async fn find_duplicates(
        &self,
        name: &str,
        name_initials: &str,
        bc: Option<&str>,
        nic: Option<&str>,
    ) -> Result<Vec<children::Model>, DbErr> {
        use sea_orm::{ColumnTrait, Condition, EntityTrait, QueryFilter};

        let mut conditions = Condition::any()
            .add(children::Column::FullName.ilike(format!("%{}%", name)))
            .add(children::Column::NameWithInitials.ilike(format!("%{}%", name_initials)));

        if let Some(bc) = bc {
            conditions = conditions.add(children::Column::BirthCertificateNumber.eq(bc));
        }
        if let Some(nic) = nic {
            conditions = conditions.add(children::Column::Nic.eq(nic));
        }

        children::Entity::find()
            .filter(conditions)
            .all(self.db)
            .await
    }

    async fn list(
        &self,
        search: Option<&str>,
        bc: Option<&str>,
        nic: Option<&str>,
        name: Option<&str>,
        has_student: Option<bool>,
    ) -> Result<Vec<children::Model>, DbErr> {
        use sea_orm::{ColumnTrait, Condition, EntityTrait, QueryFilter};

        let mut filter = children::Entity::find();

        if let Some(bc) = bc {
            if !bc.is_empty() {
                filter = filter.filter(children::Column::BirthCertificateNumber.eq(bc));
            }
        }
        if let Some(nic) = nic {
            if !nic.is_empty() {
                filter = filter.filter(children::Column::Nic.eq(nic));
            }
        }
        if let Some(name) = name {
            if !name.is_empty() {
                filter = filter.filter(children::Column::FullName.eq(name));
            }
        }
        if let Some(search) = search {
            if !search.is_empty() {
                filter = filter.filter(
                    Condition::any()
                        .add(children::Column::FullName.contains(search))
                        .add(children::Column::NameWithInitials.contains(search))
                        .add(children::Column::BirthCertificateNumber.contains(search))
                        .add(children::Column::Nic.contains(search)),
                );
            }
        }
        match has_student {
            Some(true) => filter = filter.filter(children::Column::StudentId.is_not_null()),
            Some(false) => filter = filter.filter(children::Column::StudentId.is_null()),
            _ => {}
        }

        filter.all(self.db).await
    }
}
