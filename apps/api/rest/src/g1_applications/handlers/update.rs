use actix_web::{web, web::Json};
use apistos::api_operation;
use chrono::Utc;
use db::entity::g1::applications;
use log::info;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::entity::common::enums::AuditOperation;
use db::rbac::Permission;

#[api_operation(tag = "g1-applications", operation_id = "update-application")]
pub async fn update_application(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: Json<applications::Model>,
) -> Result<Json<applications::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();
    let user_id = auth.user_id;

    info!("[update_application] user={user_id:?} app={id}");

    let existing = applications::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("application not found".into()))?;

    info!("[update_application] found existing app status={:?} wizard_step={:?} guardian_count={}",
        existing.status, existing.wizard_step, existing.guardian_id.map(|_| 1).unwrap_or(0));

    let old_json = serde_json::to_value(&existing).ok();

    let m = body.into_inner();

    info!("[update_application] incoming full_name={:?} gender={:?} school_id={:?} wizard_step={:?} guardian_id={:?}",
        m.full_name, m.gender, m.school_id, m.wizard_step, m.guardian_id);
    let active = applications::ActiveModel {
        id: Set(id),
        reference_no: Set(m.reference_no),
        applied_year: Set(m.applied_year),
        school_id: Set(m.school_id),
        guardian_id: Set(m.guardian_id),
        status: Set(m.status),
        total_marks: Set(m.total_marks),
        rank_number: Set(m.rank_number),
        list_category: Set(m.list_category),
        submitted_at: Set(m.submitted_at),
        verified_at: Set(m.verified_at),
        verified_by: Set(m.verified_by),
        finalized_at: Set(m.finalized_at),
        ip_address: Set(m.ip_address),
        user_agent: Set(m.user_agent),
        created_at: Set(m.created_at),
        updated_at: Set(Utc::now()),
        student_id: Set(m.student_id),
        batch_id: Set(m.batch_id),
        enrollment_status: Set(m.enrollment_status),
        medium_of_instruction: Set(m.medium_of_instruction),
        full_name: Set(m.full_name),
        name_with_initials: Set(m.name_with_initials),
        date_of_birth: Set(m.date_of_birth),
        gender: Set(m.gender),
        birth_certificate_number: Set(m.birth_certificate_number),
        nationality: Set(m.nationality),
        religion: Set(m.religion),
        birth_certificate_verified: Set(m.birth_certificate_verified),
        age_eligibility_verified: Set(m.age_eligibility_verified),
        residence_verified: Set(m.residence_verified),
        category_verified: Set(m.category_verified),
        submission_method: Set(m.submission_method),
        interview_date: Set(m.interview_date),
        interview_completed: Set(m.interview_completed),
        alternative_age_certificate: Set(m.alternative_age_certificate),
        alternative_age_certificate_ref: Set(m.alternative_age_certificate_ref),
        category: Set(m.category),
        overseas_arrival_date: Set(m.overseas_arrival_date),
        rejection_reason: Set(m.rejection_reason),
        created_by: Set(m.created_by),
        updated_by: Set(m.updated_by),
        wizard_step: Set(m.wizard_step),
    };

    let saved = active.update(db.as_ref()).await?;
    info!("[update_application] updated successfully wizard_step={:?}", saved.wizard_step);
    let new_json = serde_json::to_value(&saved).ok();

    db::entity::g1::audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        application_id: Set(Some(id)),
        operation: Set(AuditOperation::Update),
        changed_fields: Set(None),
        old_values: Set(old_json),
        new_values: Set(new_json),
        changed_by: Set(auth.user_id),
        changed_at: Set(Utc::now()),
        context: Set(None),
    }
    .insert(db.as_ref())
    .await?;

    Ok(Json(saved))
}
