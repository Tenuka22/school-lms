use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "g1_enrollment_join_addresses")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub enrollment_id: Uuid,
    pub address_id: Uuid,
    pub address_type: String,
    pub is_primary: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::g1_enrollments::Entity",
        from = "Column::EnrollmentId",
        to = "super::g1_enrollments::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Enrollment,
    #[sea_orm(
        belongs_to = "super::addresses::Entity",
        from = "Column::AddressId",
        to = "super::addresses::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Address,
}

impl Related<super::g1_enrollments::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Enrollment.def()
    }
}

impl Related<super::addresses::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Address.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}