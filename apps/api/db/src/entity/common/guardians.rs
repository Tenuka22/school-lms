use apistos::ApiComponent;
use chrono::{DateTime, Utc};
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

use super::default_now;
use super::enums::{GuardianRelationship, IncomeLevel};

#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent,
)]
#[schemars(rename = "Guardian")]
#[sea_orm(table_name = "guardians")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub relationship_type: GuardianRelationship,
    pub full_name: String,
    #[sea_orm(unique)]
    pub nic_number: String,
    pub contact_phone: String,
    pub contact_email: Option<String>,
    pub occupation: Option<String>,
    pub workplace_name: Option<String>,
    pub workplace_address: Option<String>,
    pub is_govt_employee: bool,
    pub govt_service_years: Option<i32>,
    pub is_school_staff: bool,
    pub is_past_pupil: bool,
    pub past_pupil_verified: bool,
    pub income_level: Option<IncomeLevel>,
    #[serde(default)]
    pub address_id: Option<Uuid>,
    pub is_sri_lankan_citizen: Option<bool>,
    pub student_id: Option<Uuid>,
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::super::g1::join_guardians::Entity")]
    EnrollmentJoinGuardian,
    #[sea_orm(has_many = "super::staff_details::Entity")]
    StaffDetails,
    #[sea_orm(has_many = "super::past_pupil_details::Entity")]
    PastPupilDetails,
}

impl Related<super::super::g1::join_guardians::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::EnrollmentJoinGuardian.def()
    }
}

impl Related<super::staff_details::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::StaffDetails.def()
    }
}

impl Related<super::past_pupil_details::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::PastPupilDetails.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
