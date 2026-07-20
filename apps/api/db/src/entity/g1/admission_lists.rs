use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use super::super::common::enums::{AdmissionListType, QuotaCategory};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "admission_lists")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub application_id: Uuid,
    pub school_id: Uuid,
    pub list_type: AdmissionListType,
    pub position_number: Option<i32>,
    pub quota_category: QuotaCategory,
    pub admitted: bool,
    pub admitted_at: Option<DateTime<Utc>>,
    pub admitted_by: Option<Uuid>,
    pub waiting_position: Option<i32>,
    pub promoted_at: Option<DateTime<Utc>>,
    pub promoted_from: Option<i32>,
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
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
    #[sea_orm(
        belongs_to = "super::super::common::schools::Entity",
        from = "Column::SchoolId",
        to = "super::super::common::schools::Column::Id"
    )]
    School,
}

impl Related<super::applications::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Application.def()
    }
}

impl Related<super::super::common::schools::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::School.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
