use super::default_now;
use super::super::common::enums::{StaffEmploymentType, StaffType};
use apistos::ApiComponent;
use chrono::{DateTime, NaiveDate, Utc};
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent,
)]
#[schemars(rename = "StaffDetail")]
#[sea_orm(table_name = "staff_details")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub guardian_id: Uuid,
    pub school_id: Uuid,
    pub staff_type: Option<StaffType>,
    pub employee_id: Option<String>,
    pub designation: Option<String>,
    pub employment_type: Option<StaffEmploymentType>,
    pub service_start_date: Option<NaiveDate>,
    pub service_end_date: Option<NaiveDate>,
    pub is_current: bool,
    pub verification_doc: Option<String>,
    pub distance_from_residence_km: Option<Decimal>,
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::super::common::guardians::Entity",
        from = "Column::GuardianId",
        to = "super::super::common::guardians::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Guardian,
    #[sea_orm(
        belongs_to = "super::schools::Entity",
        from = "Column::SchoolId",
        to = "super::schools::Column::Id"
    )]
    School,
}

impl Related<super::super::common::guardians::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Guardian.def()
    }
}

impl Related<super::schools::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::School.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
