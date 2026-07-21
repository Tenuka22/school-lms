use apistos::ApiComponent;
use chrono::{DateTime, Utc};
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent,
)]
#[sea_orm(table_name = "past_pupil_details")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub guardian_id: Uuid,
    pub school_id: Uuid,
    pub student_id: Option<String>,
    pub highest_grade: Option<String>,
    pub year_left: Option<i16>,
    pub left_reason: Option<String>,
    pub verified: bool,
    pub verification_method: Option<String>,
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
    #[sea_orm(has_many = "super::super::g1::join_past_pupil_details::Entity")]
    G1JoinPastPupilDetails,
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

impl Related<super::super::g1::join_past_pupil_details::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::G1JoinPastPupilDetails.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
