use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use super::enums::{ResidenceType};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "addresses")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[serde(default)]
    pub application_id: Option<Uuid>,
    pub address_line_1: String,
    pub address_line_2: Option<String>,
    pub city: String,
    pub district: String,
    pub province: String,
    pub gs_division: String,
    pub postal_code: Option<String>,
    pub latitude: Option<Decimal>,
    pub longitude: Option<Decimal>,
    pub distance_to_school_km: Option<Decimal>,
    pub verified_by_map: bool,
    pub residence_type: Option<ResidenceType>,
    pub ownership_proof: Option<String>,
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::super::student::join_addresses::Entity")]
    StudentAddresses,
    #[sea_orm(has_many = "super::super::g1::join_addresses::Entity")]
    EnrollmentAddresses,
}

impl Related<super::super::student::join_addresses::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::StudentAddresses.def()
    }
}

impl Related<super::super::g1::join_addresses::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::EnrollmentAddresses.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
