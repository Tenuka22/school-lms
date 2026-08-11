use super::default_now;
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

fn default_closed_at() -> DateTime<Utc> {
    let now = Utc::now();
    DateTime::from(now + chrono::Duration::days(365))
}

fn default_student_allocation() -> i32 {
    200
}

fn default_proximity_percentage() -> i16 {
    50
}

fn default_staff_percentage() -> i16 {
    25
}

fn default_sibling_percentage() -> i16 {
    14
}

fn default_alumni_percentage() -> i16 {
    6
}

fn default_govt_percentage() -> i16 {
    4
}

fn default_special_percentage() -> i16 {
    1
}

fn default_buddhism_percentage() -> i16 {
    74
}

fn default_catholicism_percentage() -> i16 {
    12
}

fn default_islam_percentage() -> i16 {
    14
}

fn default_hinduism_percentage() -> i16 {
    0
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

    #[serde(default = "default_proximity_percentage")]
    #[sea_orm(column_name = "proximity_weight")]
    pub proximity_percentage: i16,
    #[serde(default = "default_staff_percentage")]
    #[sea_orm(column_name = "staff_weight")]
    pub staff_percentage: i16,
    #[serde(default = "default_sibling_percentage")]
    #[sea_orm(column_name = "sibling_weight")]
    pub sibling_percentage: i16,
    #[serde(default = "default_alumni_percentage")]
    #[sea_orm(column_name = "alumni_weight")]
    pub alumni_percentage: i16,
    #[serde(default = "default_govt_percentage")]
    #[sea_orm(column_name = "govt_weight")]
    pub govt_percentage: i16,
    #[serde(default = "default_special_percentage")]
    #[sea_orm(column_name = "special_weight")]
    pub special_percentage: i16,

    #[serde(default = "default_buddhism_percentage")]
    #[sea_orm(column_name = "buddhism_weight")]
    pub buddhism_percentage: i16,
    #[serde(default = "default_catholicism_percentage")]
    #[sea_orm(column_name = "catholicism_weight")]
    pub catholicism_percentage: i16,
    #[serde(default = "default_islam_percentage")]
    #[sea_orm(column_name = "islam_weight")]
    pub islam_percentage: i16,
    #[serde(default = "default_hinduism_percentage")]
    #[sea_orm(column_name = "hinduism_weight")]
    pub hinduism_percentage: i16,

    #[serde(default = "default_waiting_list_size")]
    pub waiting_list_size: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
