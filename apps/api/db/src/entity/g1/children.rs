use super::super::common::enums::{Gender, MediumOfInstruction, Nationality, Religion, StudentStatus};
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

    /// Link to student record (populated on admission)
    #[serde(default)]
    pub student_id: Option<Uuid>,

    // Personal identity fields
    pub full_name: String,
    pub name_with_initials: String,
    pub date_of_birth: NaiveDate,
    pub gender: Gender,

    #[sea_orm(unique)]
    pub birth_certificate_number: Option<String>,

    /// National Identity Card number (for older children)
    #[sea_orm(unique)]
    pub nic: Option<String>,

    /// Passport number (for overseas arrivals)
    #[sea_orm(unique)]
    pub passport_number: Option<String>,

    pub name_with_initials_en: Option<String>,

    pub nationality: Nationality,
    pub religion: Option<Religion>,
    pub medium_of_instruction: MediumOfInstruction,

    #[serde(default)]
    pub disability_status: bool,
    #[serde(default)]
    pub disability_type: Option<String>,

    #[serde(default)]
    pub photo_url: Option<String>,

    // Student-specific fields (moved from students table)
    #[sea_orm(unique)]
    pub admission_number: Option<String>,
    pub admission_date: Option<NaiveDate>,
    pub current_grade: Option<i16>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub status: StudentStatus,

    // Audit fields
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
    #[serde(default = "default_now")]
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
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
