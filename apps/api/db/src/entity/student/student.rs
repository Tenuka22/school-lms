use apistos::ApiComponent;
use chrono::{DateTime, Utc};
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(
    Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent,
)]
#[schemars(rename = "Student")]
#[sea_orm(table_name = "students")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub child_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::super::g1::children::Entity",
        from = "Column::ChildId",
        to = "super::super::g1::children::Column::Id"
    )]
    Child,
}

impl Related<super::super::g1::children::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Child.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
