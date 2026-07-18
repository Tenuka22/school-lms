use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "g1_join_past_pupil_details")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub application_id: Uuid,
    pub past_pupil_detail_id: Uuid,
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
        belongs_to = "super::super::common::past_pupil_details::Entity",
        from = "Column::PastPupilDetailId",
        to = "super::super::common::past_pupil_details::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    PastPupilDetail,
}

impl Related<super::applications::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Application.def()
    }
}

impl Related<super::super::common::past_pupil_details::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::PastPupilDetail.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
