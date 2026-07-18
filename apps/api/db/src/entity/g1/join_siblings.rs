use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "g1_join_siblings")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub application_id: Uuid,
    pub sibling_id: Uuid,
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
        belongs_to = "super::super::common::siblings::Entity",
        from = "Column::SiblingId",
        to = "super::super::common::siblings::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Sibling,
}

impl Related<super::applications::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Application.def()
    }
}

impl Related<super::super::common::siblings::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Sibling.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
