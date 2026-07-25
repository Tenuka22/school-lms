use super::super::common::enums::{Gender, MediumOfInstruction, Nationality, Religion};
use apistos::ApiComponent;
use chrono::{DateTime, NaiveDate, Utc};
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent)]
#[schemars(rename = "Child")]
#[sea_orm(table_name = "children")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,

    #[serde(default)]
    pub student_id: Option<Uuid>,

    pub full_name: String,
    pub name_with_initials: String,
    pub date_of_birth: NaiveDate,
    pub gender: Gender,

    #[sea_orm(unique)]
    pub birth_certificate_number: Option<String>,

    pub nationality: Nationality,
    pub religion: Option<Religion>,
    pub medium_of_instruction: MediumOfInstruction,

    #[serde(default)]
    pub disability_status: bool,
    #[serde(default)]
    pub disability_type: Option<String>,

    #[serde(default)]
    pub photo_url: Option<String>,

    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::super::student::student::Entity",
        from = "Column::StudentId",
        to = "super::super::student::student::Column::Id"
    )]
    Student,
}

impl Related<super::super::student::student::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Student.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
