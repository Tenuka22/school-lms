use super::enums::{BatchStatus, EnrollmentType};
use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "enrollment_batches")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    /// Machine-readable code (e.g., "G1-2026")
    #[sea_orm(unique)]
    pub batch_code: String,
    /// Human-readable name (e.g., "Grade 1 Admission 2026")
    pub batch_name: String,
    pub enrollment_type: EnrollmentType,
    pub status: BatchStatus,
    pub created_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
