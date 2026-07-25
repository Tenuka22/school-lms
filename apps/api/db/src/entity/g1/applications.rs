use super::super::common::enums::{
    ApplicationListCategory, EnrollmentStatus, G1Category,
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
    EnrollmentStatus::Draft
}

fn default_reference_no() -> String {
    format!("DRAFT-{}", uuid::Uuid::new_v4())
}

fn default_guardian_id() -> Uuid {
    Uuid::nil()
}

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

fn default_child_id() -> Uuid {
    Uuid::nil()
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

    #[serde(default)]
    pub school_id: Option<Uuid>,

    pub total_marks: Option<Decimal>,
    pub rank_number: Option<i32>,
    pub list_category: Option<ApplicationListCategory>,
    pub waiting_position: Option<i32>,
    pub promoted_at: Option<DateTime<Utc>>,

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

    #[serde(default = "default_child_id")]
    pub child_id: Uuid,

    #[serde(default = "default_guardian_id")]
    pub guardian_id: Uuid,

    pub batch_id: Uuid,

    #[serde(default = "default_enrollment_status")]
    pub enrollment_status: EnrollmentStatus,

    // Application-specific fields (not child data)
    pub category: Option<G1Category>,
    pub overseas_arrival_date: Option<NaiveDate>,

    pub submission_method: Option<String>,
    pub interview_date: Option<NaiveDate>,
    pub interview_completed: bool,

    pub birth_certificate_verified: bool,
    pub age_eligibility_verified: bool,
    pub residence_verified: bool,
    pub category_verified: bool,

    pub alternative_age_certificate: bool,
    pub alternative_age_certificate_ref: Option<String>,

    pub rejection_reason: Option<String>,

    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,

    pub wizard_step: Option<i16>,

    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::children::Entity",
        from = "Column::ChildId",
        to = "super::children::Column::Id"
    )]
    Child,
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

impl Related<super::children::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Child.def()
    }
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
