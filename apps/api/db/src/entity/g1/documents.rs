use super::super::common::enums::{DocumentVerificationStatus, G1DocumentType};
use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "g1_documents")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub application_id: Uuid,
    pub document_type: G1DocumentType,
    pub file_url: String,
    pub file_key: String,
    pub file_hash: Option<String>,
    pub file_size: Option<i64>,
    pub content_type: Option<String>,
    pub uploaded_at: DateTime<Utc>,
    pub verification_status: DocumentVerificationStatus,
    pub verified_by: Option<Uuid>,
    pub verified_at: Option<DateTime<Utc>>,
    pub rejection_reason: Option<String>,
    pub fraud_flag: bool,
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
    #[serde(default = "default_now")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::applications::Entity",
        from = "Column::ApplicationId",
        to = "super::applications::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Application,
}

impl Related<super::applications::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Application.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
