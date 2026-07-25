use super::enums::{BatchStatus, EnrollmentType};
use apistos::ApiComponent;
use chrono::{DateTime, Utc};
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

fn default_id() -> Uuid {
    uuid::Uuid::new_v4()
}

fn default_batch_status() -> BatchStatus {
    BatchStatus::Open
}

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

fn default_closed_at() -> DateTime<Utc> {
    let now = Utc::now();
    DateTime::from(now + chrono::Duration::days(365))
}

fn default_student_allocation() -> i32 {
    200
}

fn default_proximity_weight() -> i16 {
    50
}

fn default_staff_weight() -> i16 {
    25
}

fn default_sibling_weight() -> i16 {
    14
}

fn default_alumni_weight() -> i16 {
    6
}

fn default_govt_weight() -> i16 {
    4
}

fn default_special_weight() -> i16 {
    1
}

fn default_waiting_list_size() -> i32 {
    20
}

#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent,
)]
#[schemars(rename = "EnrollmentBatch")]
#[sea_orm(table_name = "enrollment_batches")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    #[serde(default = "default_id")]
    pub id: Uuid,
    pub year: i16,
    /// Machine-readable code (e.g., "G1-2026")
    #[sea_orm(unique)]
    pub batch_code: String,
    /// Human-readable name (e.g., "Grade 1 Admission 2026")
    pub batch_name: String,
    pub enrollment_type: EnrollmentType,
    #[serde(default = "default_batch_status")]
    pub status: BatchStatus,

    #[serde(default = "default_now")]
    pub opened_at: DateTime<Utc>,
    #[serde(default = "default_closed_at")]
    pub closed_at: DateTime<Utc>,
    #[serde(default)]
    pub list_published_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub appeal_deadline_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub finalized_at: Option<DateTime<Utc>>,

    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
    #[serde(default)]
    pub created_by: Option<Uuid>,

    #[serde(default = "default_student_allocation")]
    pub student_allocation: i32,

    #[serde(default = "default_proximity_weight")]
    pub proximity_weight: i16,
    #[serde(default = "default_staff_weight")]
    pub staff_weight: i16,
    #[serde(default = "default_sibling_weight")]
    pub sibling_weight: i16,
    #[serde(default = "default_alumni_weight")]
    pub alumni_weight: i16,
    #[serde(default = "default_govt_weight")]
    pub govt_weight: i16,
    #[serde(default = "default_special_weight")]
    pub special_weight: i16,

    #[serde(default = "default_waiting_list_size")]
    pub waiting_list_size: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
