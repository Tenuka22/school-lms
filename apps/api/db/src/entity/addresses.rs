use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "addresses")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub address_type: String,
    pub address_line_1: String,
    pub address_line_2: Option<String>,
    pub city: String,
    pub district: String,
    pub divisional_secretariat: Option<String>,
    pub gn_division: Option<String>,
    pub postal_code: Option<String>,
    pub distance_from_school_km: Option<Decimal>,
    pub is_close_residence: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::student_join_addresses::Entity")]
    StudentAddresses,
    #[sea_orm(has_many = "super::g1_enrollment_join_addresses::Entity")]
    EnrollmentAddresses,
}

impl Related<super::student_join_addresses::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::StudentAddresses.def()
    }
}

impl Related<super::g1_enrollment_join_addresses::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::EnrollmentAddresses.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}