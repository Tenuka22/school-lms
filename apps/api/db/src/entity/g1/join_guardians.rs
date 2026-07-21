use super::super::common::enums::GuardianRelationship;
use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "g1_join_guardians")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub application_id: Uuid,
    pub guardian_id: Uuid,
    pub relationship: GuardianRelationship,
    pub is_primary: bool,
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
        belongs_to = "super::super::common::guardians::Entity",
        from = "Column::GuardianId",
        to = "super::super::common::guardians::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Guardian,
}

impl Related<super::applications::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Application.def()
    }
}

impl Related<super::super::common::guardians::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Guardian.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
