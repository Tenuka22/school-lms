use apistos::ApiComponent;
use chrono::{DateTime, Utc, NaiveDate};
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use super::super::common::enums::{Gender, Nationality, Religion, MediumOfInstruction, StudentStatus};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent)]
#[schemars(rename = "Student")]
#[sea_orm(table_name = "students")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub admission_number: Option<String>,
    pub full_name: String,
    pub name_with_initials: String,
    /// Format: YYYY-MM-DD
    pub date_of_birth: NaiveDate,
    pub gender: Gender,
    #[sea_orm(unique)]
    pub birth_certificate_number: Option<String>,
    #[sea_orm(unique)]
    pub nic: Option<String>,
    #[sea_orm(unique)]
    pub passport_number: Option<String>,
    pub nationality: Nationality,
    pub religion: Option<Religion>,
    pub medium_of_instruction: MediumOfInstruction,
    /// E.164 format recommended
    pub phone: Option<String>,
    pub email: Option<String>,
    pub status: StudentStatus,
    pub admission_date: Option<NaiveDate>,
    /// Integer representing the grade (e.g., 1 for Grade 1)
    pub current_grade: Option<i16>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::join_addresses::Entity")]
    StudentJoinAddress,
    #[sea_orm(has_many = "super::join_guardians::Entity")]
    StudentJoinGuardian,
}

impl Related<super::join_addresses::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::StudentJoinAddress.def()
    }
}

impl Related<super::join_guardians::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::StudentJoinGuardian.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
