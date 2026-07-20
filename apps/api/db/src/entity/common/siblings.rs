use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

fn default_now() -> DateTime<Utc> {
    Utc::now()
}

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "siblings")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub student_id: Uuid,
    pub school_id: Uuid,
    pub sibling_name: String,
    pub current_grade: Option<i16>,
    pub admission_year: Option<i16>,
    pub verified: bool,
    pub verification_doc: Option<String>,
    #[serde(default = "default_now")]
    pub created_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::super::student::student::Entity",
        from = "Column::StudentId",
        to = "super::super::student::student::Column::Id"
    )]
    Student,
    #[sea_orm(
        belongs_to = "super::schools::Entity",
        from = "Column::SchoolId",
        to = "super::schools::Column::Id"
    )]
    School,
    #[sea_orm(has_many = "super::super::g1::join_siblings::Entity")]
    G1JoinSiblings,
}

impl Related<super::super::student::student::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Student.def()
    }
}

impl Related<super::schools::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::School.def()
    }
}

impl Related<super::super::g1::join_siblings::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::G1JoinSiblings.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
