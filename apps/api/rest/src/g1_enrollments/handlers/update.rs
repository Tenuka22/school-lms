use actix_web::{web, web::Json};
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::entity::enums::*;
use db::entity::{enrollment_batches, g1_enrollments, g1_enrollments_audit};
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct UpdateG1EnrollmentBody {
    pub batch_id: Option<Uuid>,
    pub enrollment_status: Option<EnrollmentStatus>,
    pub medium_of_instruction: Option<MediumOfInstruction>,
    pub full_name: Option<String>,
    pub name_with_initials: Option<String>,
    pub date_of_birth: Option<chrono::NaiveDate>,
    pub gender: Option<Gender>,
    pub birth_certificate_number: Option<Option<String>>,
    pub nationality: Option<Nationality>,
    #[serde(default)]
    pub religion: Option<Option<Religion>>,
    pub birth_certificate_verified: Option<bool>,
    pub age_eligibility_verified: Option<bool>,
    pub residence_verified: Option<bool>,
    pub category_verified: Option<bool>,
    pub submission_method: Option<Option<String>>,
    pub interview_date: Option<Option<chrono::NaiveDate>>,
    pub interview_completed: Option<bool>,
    pub alternative_age_certificate: Option<bool>,
    pub alternative_age_certificate_ref: Option<Option<String>>,
    pub category: Option<G1Category>,
    pub rank: Option<Option<i32>>,
    pub rejection_reason: Option<Option<String>>,
}

#[api_operation(tag = "g1-enrollments", operation_id = "update-enrollment")]
pub async fn update_enrollment(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: Json<UpdateG1EnrollmentBody>,
) -> Result<Json<g1_enrollments::Model>, ApiError> {
    auth.require_permission(Permission::All)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();
    let patch = body.into_inner();

    let existing = g1_enrollments::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("enrollment not found".into()))?;

    if let Some(new_batch_id) = patch.batch_id {
        if new_batch_id != existing.batch_id {
            let exists = enrollment_batches::Entity::find()
                .filter(enrollment_batches::Column::Id.eq(new_batch_id))
                .one(db.as_ref())
                .await?
                .is_some();
            if !exists {
                return Err(ApiError::BadRequest(format!(
                    "batch {new_batch_id} not found"
                )));
            }
        }
    }

    let old_json = serde_json::to_value(&existing).ok();

    let active = g1_enrollments::ActiveModel {
        id: Set(existing.id),
        student_id: Set(existing.student_id),
        batch_id: Set(patch.batch_id.unwrap_or(existing.batch_id)),
        enrollment_status: Set(patch.enrollment_status.unwrap_or(existing.enrollment_status)),
        medium_of_instruction: Set(patch.medium_of_instruction.unwrap_or(existing.medium_of_instruction)),
        full_name: Set(patch.full_name.unwrap_or(existing.full_name)),
        name_with_initials: Set(patch.name_with_initials.unwrap_or(existing.name_with_initials)),
        date_of_birth: Set(patch.date_of_birth.unwrap_or(existing.date_of_birth)),
        gender: Set(patch.gender.unwrap_or(existing.gender)),
        birth_certificate_number: Set(patch.birth_certificate_number.unwrap_or(existing.birth_certificate_number)),
        nationality: Set(patch.nationality.unwrap_or(existing.nationality)),
        religion: Set(patch.religion.unwrap_or(existing.religion)),
        birth_certificate_verified: Set(patch.birth_certificate_verified.unwrap_or(existing.birth_certificate_verified)),
        age_eligibility_verified: Set(patch.age_eligibility_verified.unwrap_or(existing.age_eligibility_verified)),
        residence_verified: Set(patch.residence_verified.unwrap_or(existing.residence_verified)),
        category_verified: Set(patch.category_verified.unwrap_or(existing.category_verified)),
        submission_method: Set(patch.submission_method.unwrap_or(existing.submission_method)),
        interview_date: Set(patch.interview_date.unwrap_or(existing.interview_date)),
        interview_completed: Set(patch.interview_completed.unwrap_or(existing.interview_completed)),
        alternative_age_certificate: Set(patch.alternative_age_certificate.unwrap_or(existing.alternative_age_certificate)),
        alternative_age_certificate_ref: Set(patch.alternative_age_certificate_ref.unwrap_or(existing.alternative_age_certificate_ref)),
        category: Set(patch.category.unwrap_or(existing.category)),
        rank: Set(patch.rank.unwrap_or(existing.rank)),
        rejection_reason: Set(patch.rejection_reason.unwrap_or(existing.rejection_reason)),
        sibling_student_id: Set(existing.sibling_student_id),
        past_pupil_parent_id: Set(existing.past_pupil_parent_id),
        staff_parent_id: Set(existing.staff_parent_id),
        transfer_officer_parent_id: Set(existing.transfer_officer_parent_id),
        armed_forces_parent_id: Set(existing.armed_forces_parent_id),
        overseas_arrival_date: Set(existing.overseas_arrival_date),
        interview_score: Set(existing.interview_score),
        category_score: Set(existing.category_score),
        distance_score: Set(existing.distance_score),
        total_score: Set(existing.total_score),
        provisionally_approved_by: Set(existing.provisionally_approved_by),
        provisionally_approved_at: Set(existing.provisionally_approved_at),
        approved_by: Set(existing.approved_by),
        approved_at: Set(existing.approved_at),
        created_at: Set(existing.created_at),
        updated_at: Set(Utc::now()),
        created_by: Set(existing.created_by),
        updated_by: Set(existing.updated_by),
    };

    let saved = active.update(db.as_ref()).await?;
    let new_json = serde_json::to_value(&saved).ok();

    g1_enrollments_audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        enrollment_id: Set(Some(id)),
        operation: Set(AuditOperation::Update),
        changed_fields: Set(None),
        old_values: Set(old_json),
        new_values: Set(new_json),
        changed_by: Set(None),
        changed_at: Set(Utc::now()),
        context: Set(None),
    }
    .insert(db.as_ref())
    .await?;

    Ok(Json(saved))
}
