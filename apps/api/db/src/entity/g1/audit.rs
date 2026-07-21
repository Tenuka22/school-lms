use super::super::common::enums::AuditOperation;
use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "g1_applications_audit")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub application_id: Option<Uuid>,
    pub operation: AuditOperation,
    pub changed_fields: Option<Vec<String>>,
    pub old_values: Option<Json>,
    pub new_values: Option<Json>,
    pub changed_by: Option<Uuid>,
    pub changed_at: DateTime<Utc>,
    pub context: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
