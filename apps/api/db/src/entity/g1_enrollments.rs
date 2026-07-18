use apistos::ApiComponent;
use chrono::{DateTime, Utc, NaiveDate};
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use super::enums::{EnrollmentStatus, MediumOfInstruction, Gender, Nationality, Religion, G1Category};

fn default_id() -> Uuid {
    uuid::Uuid::new_v4()
}

fn default_enrollment_status() -> EnrollmentStatus {
    EnrollmentStatus::Draft
}

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent)]
#[schemars(rename = "G1Enrollment")]
#[sea_orm(table_name = "g1_enrollments")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    #[serde(default = "default_id")]
    pub id: Uuid,
    #[serde(default)]
    pub student_id: Option<Uuid>,
    pub batch_id: Uuid,
    #[serde(default = "default_enrollment_status")]
    pub enrollment_status: EnrollmentStatus,
    pub medium_of_instruction: MediumOfInstruction,
    pub full_name: String,
    pub name_with_initials: String,
    pub date_of_birth: NaiveDate,
    pub gender: Gender,
    #[serde(default)]
    pub birth_certificate_number: Option<String>,
    pub nationality: Nationality,
    #[serde(default)]
    pub religion: Option<Religion>,
    #[serde(default)]
    pub birth_certificate_verified: bool,
    #[serde(default)]
    pub age_eligibility_verified: bool,
    #[serde(default)]
    pub residence_verified: bool,
    #[serde(default)]
    pub category_verified: bool,
    #[serde(default)]
    pub submission_method: Option<String>,
    #[serde(default)]
    pub interview_date: Option<NaiveDate>,
    #[serde(default)]
    pub interview_completed: bool,
    #[serde(default)]
    pub alternative_age_certificate: bool,
    #[serde(default)]
    pub alternative_age_certificate_ref: Option<String>,
    pub category: G1Category,
    #[serde(default)]
    pub sibling_student_id: Option<Uuid>,
    #[serde(default)]
    pub past_pupil_parent_id: Option<Uuid>,
    #[serde(default)]
    pub staff_parent_id: Option<Uuid>,
    #[serde(default)]
    pub transfer_officer_parent_id: Option<Uuid>,
    #[serde(default)]
    pub armed_forces_parent_id: Option<Uuid>,
    #[serde(default)]
    pub overseas_arrival_date: Option<NaiveDate>,
    #[serde(default)]
    pub interview_score: Option<Decimal>,
    #[serde(default)]
    pub category_score: Option<Decimal>,
    #[serde(default)]
    pub distance_score: Option<Decimal>,
    #[serde(default)]
    pub total_score: Option<Decimal>,
    #[serde(default)]
    pub rank: Option<i32>,
    #[serde(default)]
    pub provisionally_approved_by: Option<Uuid>,
    #[serde(default)]
    pub provisionally_approved_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub approved_by: Option<Uuid>,
    #[serde(default)]
    pub approved_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub rejection_reason: Option<String>,
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
    #[serde(default = "default_now")]
    pub updated_at: DateTime<Utc>,
    #[serde(default)]
    pub created_by: Option<Uuid>,
    #[serde(default)]
    pub updated_by: Option<Uuid>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::student::Entity",
        from = "Column::StudentId",
        to = "super::student::Column::Id"
    )]
    Student,
    #[sea_orm(
        belongs_to = "super::enrollment_batches::Entity",
        from = "Column::BatchId",
        to = "super::enrollment_batches::Column::Id"
    )]
    Batch,
    #[sea_orm(has_many = "super::g1_enrollment_join_addresses::Entity")]
    EnrollmentJoinAddress,
    #[sea_orm(has_many = "super::g1_enrollment_join_guardians::Entity")]
    EnrollmentJoinGuardian,
}

impl Related<super::student::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Student.def()
    }
}

impl Related<super::enrollment_batches::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Batch.def()
    }
}

impl Related<super::g1_enrollment_join_addresses::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::EnrollmentJoinAddress.def()
    }
}

impl Related<super::g1_enrollment_join_guardians::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::EnrollmentJoinGuardian.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
