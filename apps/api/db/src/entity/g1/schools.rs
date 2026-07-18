use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use super::super::common::enums::{SchoolType, SchoolCategory};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "schools")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub school_name_si: String,
    pub school_name_en: Option<String>,
    pub school_type: SchoolType,
    pub address: Option<String>,
    pub district_id: Option<Uuid>,
    pub category: SchoolCategory,
    pub grade_1_quota: i32,
    pub geo_latitude: Option<Decimal>,
    pub geo_longitude: Option<Decimal>,
    pub status: String,
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::applications::Entity")]
    Applications,
    #[sea_orm(has_many = "super::super::common::siblings::Entity")]
    Siblings,
    #[sea_orm(has_many = "super::super::common::staff_details::Entity")]
    StaffDetails,
    #[sea_orm(has_many = "super::super::common::past_pupil_details::Entity")]
    PastPupilDetails,
    #[sea_orm(has_many = "super::admission_lists::Entity")]
    AdmissionLists,
}

impl Related<super::applications::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Applications.def()
    }
}

impl Related<super::super::common::siblings::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Siblings.def()
    }
}

impl Related<super::super::common::staff_details::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::StaffDetails.def()
    }
}

impl Related<super::super::common::past_pupil_details::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::PastPupilDetails.def()
    }
}

impl Related<super::admission_lists::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::AdmissionLists.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
