use actix_web::web;
use apistos::ApiComponent;
use apistos::api_operation;
use chrono::Utc;
use db::entity::common::enrollment_batches;
use db::entity::common::enums::{EnrollmentStatus, AuditOperation};
use db::entity::g1::applications;
use log::info;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Deserialize, Serialize, JsonSchema, ApiComponent)]
pub struct SaveStepRequest {
    pub wizard_step: i16,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct SaveStepResponse {
    pub wizard_step: i16,
}

#[api_operation(tag = "g1-applications", operation_id = "save-wizard-step")]
pub async fn save_wizard_step(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: web::Json<SaveStepRequest>,
) -> Result<web::Json<SaveStepResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let app_id = id.into_inner();
    let _body = body.into_inner();
    crate::validation::WizardStep::new(_body.wizard_step)?;
    let step = _body.wizard_step;

    info!(
        "[save_wizard_step] user={:?} app={app_id} step={step}",
        auth.user_id
    );

    let existing = applications::Entity::find_by_id(app_id)
        .filter(applications::Column::DeletedAt.is_null())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| {
            info!("[save_wizard_step] application {app_id} not found");
            ApiError::NotFound("Application not found".into())
        })?;

    match existing.enrollment_status {
        EnrollmentStatus::Draft | EnrollmentStatus::Pending | EnrollmentStatus::Completed => {}
        _ => {
            return Err(ApiError::BadRequest(
                "cannot update wizard step after submission".into(),
            ));
        }
    }

    let batch = enrollment_batches::Entity::find_by_id(existing.batch_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::BadRequest("enrollment batch not found".into()))?;

    let now = Utc::now();
    if batch.status != db::entity::common::enums::BatchStatus::Open || batch.closed_at <= now {
        return Err(ApiError::BadRequest(
            "cannot save wizard step after enrollment batch closed".into(),
        ));
    }

    info!(
        "[save_wizard_step] current wizard_step={:?} -> setting to {step}",
        existing.wizard_step
    );

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
        wizard_step: Set(Some(step)),
        deleted_at: Set(existing.deleted_at),
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

    let old_step = existing.wizard_step;
    let _saved = active.update(db.as_ref()).await?;

    crate::audit::log_application_change(
        db.as_ref(),
        app_id,
        AuditOperation::Update,
        Some(serde_json::json!({"wizard_step": old_step})),
        Some(serde_json::json!({"wizard_step": step})),
        &auth,
        Some(format!("wizard step {} -> {}", old_step.unwrap_or(0), step)),
    )
    .await;

    info!("[save_wizard_step] saved successfully");

    Ok(web::Json(SaveStepResponse { wizard_step: step }))
}
