use apistos::ApiComponent;
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize, JsonSchema, ApiComponent)]
#[schemars(rename = "District")]
#[sea_orm(table_name = "districts")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub name_si: String,
    pub name_en: String,
    pub province: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::schools::Entity")]
    Schools,
}

impl Related<super::schools::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Schools.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
