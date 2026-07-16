use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use super::enums::{DocumentType, VerificationStatus};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "g1_enrollment_documents")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub enrollment_id: Uuid,
    pub document_type: DocumentType,
    pub file_url: String,
    pub verification_status: VerificationStatus,
    pub verified_by: Option<Uuid>,
    pub verified_at: Option<DateTime<Utc>>,
    pub rejection_reason: Option<String>,
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
}

impl Related<super::g1_enrollments::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Enrollment.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
