use super::default_now;
use apistos::ApiComponent;
use chrono::{DateTime, Utc};
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

fn default_id() -> Uuid {
    uuid::Uuid::new_v4()
}

fn default_expires_at() -> DateTime<Utc> {
    let now = Utc::now();
    DateTime::from(now + chrono::Duration::days(365 * 3))
}

fn default_status() -> String {
    "Active".to_string()
}

#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent,
)]
#[schemars(rename = "Blacklist")]
#[sea_orm(table_name = "blacklist")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    #[serde(default = "default_id")]
    pub id: Uuid,
    pub guardian_id: Uuid,
    pub application_id: Option<Uuid>,
    pub reason: String,
    pub evidence_url: Option<String>,
    #[serde(default = "default_now")]
    pub blacklisted_at: DateTime<Utc>,
    #[serde(default = "default_expires_at")]
    pub expires_at: DateTime<Utc>,
    pub blacklisted_by: Option<Uuid>,
    #[serde(default = "default_status")]
    pub status: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
