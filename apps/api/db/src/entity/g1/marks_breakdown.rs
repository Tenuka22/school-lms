use super::super::common::enums::DistanceBand;
use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "marks_breakdown")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub application_id: Uuid,
    pub category_code: String,
    pub raw_marks: Option<Decimal>,
    pub max_raw_marks: Option<Decimal>,
    pub weight_percentage: Option<Decimal>,
    pub weighted_score: Option<Decimal>,
    pub distance_km: Option<Decimal>,
    pub distance_band: Option<DistanceBand>,
    #[serde(default = "default_now")]
    pub calculated_at: DateTime<Utc>,
    pub calculation_rule: Option<String>,
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
