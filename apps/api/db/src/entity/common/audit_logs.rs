use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use super::enums::AuditAction;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "audit_logs")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub table_name: String,
    pub record_id: Uuid,
    pub action: AuditAction,
    pub old_values: Option<Json>,
    pub new_values: Option<Json>,
    pub performed_by: Option<Uuid>,
    pub performed_at: DateTime<Utc>,
    pub ip_address: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
