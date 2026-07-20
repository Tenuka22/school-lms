use apistos::ApiComponent;
use chrono::{DateTime, Utc};
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent)]
#[schemars(rename = "WorkspaceAddress")]
#[sea_orm(table_name = "workspace_addresses")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub name: String,
    pub building: Option<String>,
    pub street_1: String,
    pub street_2: Option<String>,
    pub city: String,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub country: String,
    pub full_address: String,
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
