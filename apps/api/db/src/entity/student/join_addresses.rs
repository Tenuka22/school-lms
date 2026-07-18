use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "student_join_addresses")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub student_id: Uuid,
    pub address_id: Uuid,
    pub address_type: String,
    pub is_primary: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::student::Entity",
        from = "Column::StudentId",
        to = "super::student::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Student,
    #[sea_orm(
        belongs_to = "super::super::common::addresses::Entity",
        from = "Column::AddressId",
        to = "super::super::common::addresses::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Address,
}

impl Related<super::student::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Student.def()
    }
}

impl Related<super::super::common::addresses::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Address.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
