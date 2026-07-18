use chrono::{DateTime, Utc, NaiveDate};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use super::super::common::enums::{Gender, Nationality, Religion};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "children")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub full_name: String,
    pub date_of_birth: NaiveDate,
    #[sea_orm(unique)]
    pub birth_reg_number: Option<String>,
    pub gender: Gender,
    pub photo_url: Option<String>,
    pub religion: Option<Religion>,
    pub nationality: Nationality,
    pub disability_status: bool,
    pub disability_type: Option<String>,
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::applications::Entity")]
    Applications,
}

impl Related<super::applications::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Applications.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
