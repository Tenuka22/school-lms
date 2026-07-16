use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use super::enums::GuardianRelationship;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "g1_enrollment_join_guardians")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub enrollment_id: Uuid,
    pub guardian_id: Uuid,
    pub relationship: GuardianRelationship,
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
        belongs_to = "super::guardians::Entity",
        from = "Column::GuardianId",
        to = "super::guardians::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Guardian,
}

impl Related<super::g1_enrollments::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Enrollment.def()
    }
}

impl Related<super::guardians::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Guardian.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}