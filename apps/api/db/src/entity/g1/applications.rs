use super::super::common::enums::{
    EnrollmentStatus, G1Category, Gender, MediumOfInstruction, Nationality, Religion,
};
use apistos::ApiComponent;
use chrono::{DateTime, NaiveDate, Utc};
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

fn default_id() -> Uuid {
    uuid::Uuid::new_v4()
}

fn default_enrollment_status() -> EnrollmentStatus {
    EnrollmentStatus::Pending
}

fn default_reference_no() -> String {
    format!("TMP-{}", uuid::Uuid::new_v4())
}

fn default_applied_year() -> i16 {
    0
}

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent,
)]
#[schemars(rename = "G1Application")]
#[sea_orm(table_name = "g1_applications")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    #[serde(default = "default_id")]
    pub id: Uuid,

    #[sea_orm(unique)]
    #[serde(default = "default_reference_no")]
    pub reference_no: String,

    #[serde(default = "default_applied_year")]
    pub applied_year: i16,
    #[serde(default)]
    pub school_id: Option<Uuid>,

    pub total_marks: Option<Decimal>,
    pub rank_number: Option<i32>,
    pub list_category: Option<String>,

    pub submitted_at: Option<DateTime<Utc>>,
    pub verified_at: Option<DateTime<Utc>>,
    pub verified_by: Option<Uuid>,
    pub finalized_at: Option<DateTime<Utc>>,

    pub ip_address: Option<String>,
    pub user_agent: Option<String>,

    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
    #[serde(default = "default_now")]
    pub updated_at: DateTime<Utc>,

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

    #[serde(default)]
    pub category: Option<G1Category>,

    #[serde(default)]
    pub overseas_arrival_date: Option<NaiveDate>,

    #[serde(default)]
    pub rejection_reason: Option<String>,

    #[serde(default)]
    pub created_by: Option<Uuid>,

    #[serde(default)]
    pub updated_by: Option<Uuid>,

    #[serde(default)]
    pub wizard_step: Option<i16>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::super::student::student::Entity",
        from = "Column::StudentId",
        to = "super::super::student::student::Column::Id"
    )]
    Student,
    #[sea_orm(
        belongs_to = "super::super::common::schools::Entity",
        from = "Column::SchoolId",
        to = "super::super::common::schools::Column::Id"
    )]
    School,
    #[sea_orm(
        belongs_to = "super::super::common::enrollment_batches::Entity",
        from = "Column::BatchId",
        to = "super::super::common::enrollment_batches::Column::Id"
    )]
    Batch,
    #[sea_orm(has_many = "super::documents::Entity")]
    Documents,
    #[sea_orm(has_many = "super::join_addresses::Entity")]
    JoinAddresses,
    #[sea_orm(has_many = "super::join_guardians::Entity")]
    JoinGuardians,
    #[sea_orm(has_many = "super::marks_breakdown::Entity")]
    MarksBreakdown,
    #[sea_orm(has_many = "super::appeal_history::Entity")]
    AppealHistory,
    #[sea_orm(has_many = "super::admission_lists::Entity")]
    AdmissionLists,
    #[sea_orm(has_many = "super::join_staff_details::Entity")]
    JoinStaffDetails,
    #[sea_orm(has_many = "super::join_past_pupil_details::Entity")]
    JoinPastPupilDetails,
    #[sea_orm(has_many = "super::join_siblings::Entity")]
    JoinSiblings,
}

impl Related<super::super::common::schools::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::School.def()
    }
}

impl Related<super::super::common::enrollment_batches::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Batch.def()
    }
}

impl Related<super::documents::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Documents.def()
    }
}

impl Related<super::join_addresses::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::JoinAddresses.def()
    }
}

impl Related<super::join_guardians::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::JoinGuardians.def()
    }
}

impl Related<super::marks_breakdown::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::MarksBreakdown.def()
    }
}

impl Related<super::appeal_history::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::AppealHistory.def()
    }
}

impl Related<super::admission_lists::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::AdmissionLists.def()
    }
}

impl Related<super::join_staff_details::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::JoinStaffDetails.def()
    }
}

impl Related<super::join_past_pupil_details::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::JoinPastPupilDetails.def()
    }
}

impl Related<super::join_siblings::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::JoinSiblings.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
