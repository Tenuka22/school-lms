use chrono::{DateTime, Utc, NaiveDate};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use super::enums::{EnrollmentStatus, MediumOfInstruction, Gender, Nationality, Religion, G1Category};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "g1_enrollments")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub student_id: Option<Uuid>,
    pub batch_id: Uuid,
    pub enrollment_status: EnrollmentStatus,
    pub medium_of_instruction: MediumOfInstruction,
    pub full_name: String,
    pub name_with_initials: String,
    pub date_of_birth: NaiveDate,
    pub gender: Gender,
    pub birth_certificate_number: Option<String>,
    pub nationality: Nationality,
    pub religion: Option<Religion>,
    pub birth_certificate_verified: bool,
    pub age_eligibility_verified: bool,
    pub residence_verified: bool,
    pub category_verified: bool,
    pub submission_method: Option<String>,
    pub interview_date: Option<NaiveDate>,
    pub interview_completed: bool,
    pub alternative_age_certificate: bool,
    pub alternative_age_certificate_ref: Option<String>,
    pub category: G1Category,
    pub sibling_student_id: Option<Uuid>,
    pub past_pupil_parent_id: Option<Uuid>,
    pub staff_parent_id: Option<Uuid>,
    pub transfer_officer_parent_id: Option<Uuid>,
    pub armed_forces_parent_id: Option<Uuid>,
    pub overseas_arrival_date: Option<NaiveDate>,
    pub interview_score: Option<Decimal>,
    pub category_score: Option<Decimal>,
    pub distance_score: Option<Decimal>,
    pub total_score: Option<Decimal>,
    pub rank: Option<i32>,
    pub provisionally_approved_by: Option<Uuid>,
    pub provisionally_approved_at: Option<DateTime<Utc>>,
    pub approved_by: Option<Uuid>,
    pub approved_at: Option<DateTime<Utc>>,
    pub rejection_reason: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
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
