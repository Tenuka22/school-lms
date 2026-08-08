use actix_web::{web, web::Json};
use apistos::api_operation;
use chrono::Utc;
use db::entity::common::enrollment_batches;
use db::entity::common::enums::{AuditAction, BatchStatus, EnrollmentStatus};
use db::entity::g1::applications;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::docs::MessageResponse;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "g1-applications", operation_id = "delete-application")]
pub async fn delete_application(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<MessageResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationDelete)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();

    let existing = applications::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("application not found".into()))?;

    match existing.enrollment_status {
        EnrollmentStatus::Draft | EnrollmentStatus::Pending | EnrollmentStatus::Rejected => {}
        _ => {
            return Err(ApiError::BadRequest(
                "cannot delete application in current status".into(),
            ));
        }
    }

    let batch = enrollment_batches::Entity::find_by_id(existing.batch_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::BadRequest("enrollment batch not found".into()))?;

    let now = Utc::now();
    if batch.status != BatchStatus::Open || batch.closed_at <= now {
        return Err(ApiError::BadRequest(
            "cannot delete application after enrollment batch closed".into(),
        ));
    }

    let old_json = serde_json::to_value(&existing).ok();

    let active = applications::ActiveModel {
        id: Set(existing.id),
        reference_no: Set(existing.reference_no),
        school_id: Set(existing.school_id),
        total_marks: Set(existing.total_marks),
        rank_number: Set(existing.rank_number),
        list_category: Set(existing.list_category),
        submitted_at: Set(existing.submitted_at),
        verified_at: Set(existing.verified_at),
        verified_by: Set(existing.verified_by),
        finalized_at: Set(existing.finalized_at),
        ip_address: Set(existing.ip_address),
        user_agent: Set(existing.user_agent),
        created_at: Set(existing.created_at),
        updated_at: Set(Utc::now()),
        child_id: Set(existing.child_id),
        guardian_id: Set(existing.guardian_id),
        batch_id: Set(existing.batch_id),
        enrollment_status: Set(existing.enrollment_status),
        category: Set(existing.category),
        overseas_arrival_date: Set(existing.overseas_arrival_date),
        submission_method: Set(existing.submission_method),
        interview_date: Set(existing.interview_date),
        interview_completed: Set(existing.interview_completed),
        birth_certificate_verified: Set(existing.birth_certificate_verified),
        age_eligibility_verified: Set(existing.age_eligibility_verified),
        residence_verified: Set(existing.residence_verified),
        category_verified: Set(existing.category_verified),
        alternative_age_certificate: Set(existing.alternative_age_certificate),
        alternative_age_certificate_ref: Set(existing.alternative_age_certificate_ref),
        rejection_reason: Set(existing.rejection_reason),
        created_by: Set(existing.created_by),
        updated_by: Set(existing.updated_by),
        wizard_step: Set(existing.wizard_step),
        deleted_at: Set(Some(Utc::now())),
        preferred_school_ids: Set(existing.preferred_school_ids),
        electoral_year: Set(existing.electoral_year),
        polling_district: Set(existing.polling_district),
        polling_division: Set(existing.polling_division),
        gn_name: Set(existing.gn_name),
        gn_number: Set(existing.gn_number),
        polling_area: Set(existing.polling_area),
        village_street: Set(existing.village_street),
        voter_names: Set(existing.voter_names),
        household_head_name: Set(existing.household_head_name),
        declaration_agreed: Set(existing.declaration_agreed),
        declaration_signed_at: Set(existing.declaration_signed_at),
        closer_school_exists: Set(existing.closer_school_exists),
    };

    active.update(db.as_ref()).await?;

    db::entity::audit_logs::ActiveModel {
        id: Set(Uuid::new_v4()),
        table_name: Set("g1_applications".to_string()),
        record_id: Set(id),
        action: Set(AuditAction::Delete),
        old_values: Set(old_json),
        new_values: Set(None),
        performed_by: Set(auth.user_id),
        performed_at: Set(Utc::now()),
        ip_address: Set(None),
        reason: Set(None),
    }
    .insert(db.as_ref())
    .await?;

    Ok(Json(MessageResponse {
        message: "application deleted".into(),
    }))
}
