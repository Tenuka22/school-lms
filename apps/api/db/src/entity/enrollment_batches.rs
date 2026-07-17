use super::enums::{BatchStatus, EnrollmentType};
use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

fn default_id() -> Uuid {
    uuid::Uuid::new_v4()
}

fn default_batch_status() -> BatchStatus {
    BatchStatus::Open
}

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, ToSchema)]
#[sea_orm(table_name = "enrollment_batches")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    #[serde(default = "default_id")]
    pub id: Uuid,
    /// Machine-readable code (e.g., "G1-2026")
    #[sea_orm(unique)]
    pub batch_code: String,
    /// Human-readable name (e.g., "Grade 1 Admission 2026")
    pub batch_name: String,
    #[schema(value_type = String)]
    pub enrollment_type: EnrollmentType,
    #[serde(default = "default_batch_status")]
    #[schema(value_type = String)]
    pub status: BatchStatus,
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
    #[serde(default)]
    pub created_by: Option<Uuid>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
