use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "guardians")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    #[sea_orm(unique)]
    pub nic: String,
    pub name: String,
    pub phone: String,
    pub email: Option<String>,
    pub occupation: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::student_join_guardians::Entity")]
    StudentJoinGuardian,
    #[sea_orm(has_many = "super::g1_enrollment_join_guardians::Entity")]
    EnrollmentJoinGuardian,
}

impl Related<super::student_join_guardians::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::StudentJoinGuardian.def()
    }
}

impl Related<super::g1_enrollment_join_guardians::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::EnrollmentJoinGuardian.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
