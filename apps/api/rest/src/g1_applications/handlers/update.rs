use actix_web::{web, web::Json};
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::entity::common::enrollment_batches;
use db::entity::g1::applications;
use log::info;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::entity::common::enums::AuditOperation;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct UpdateApplicationBody {
    pub school_id: Option<Uuid>,
    pub child_id: Option<Uuid>,
    pub guardian_id: Option<Uuid>,
    pub wizard_step: Option<i16>,
    pub category: Option<db::entity::common::enums::G1Category>,
    pub overseas_arrival_date: Option<chrono::NaiveDate>,
    pub submission_method: Option<String>,
    pub interview_date: Option<chrono::NaiveDate>,
    pub interview_completed: Option<bool>,
    pub alternative_age_certificate: Option<bool>,
    pub alternative_age_certificate_ref: Option<String>,
    pub birth_certificate_verified: Option<bool>,
    pub age_eligibility_verified: Option<bool>,
    pub residence_verified: Option<bool>,
    pub category_verified: Option<bool>,
    pub rejection_reason: Option<String>,
}

#[api_operation(tag = "g1-applications", operation_id = "update-application")]
pub async fn update_application(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: Json<UpdateApplicationBody>,
) -> Result<Json<applications::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();
    let user_id = auth.user_id;

    info!("[update_application] user={user_id:?} app={id}");

    let existing = applications::Entity::find_by_id(id)
        .filter(applications::Column::DeletedAt.is_null())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("application not found".into()))?;

    let batch = enrollment_batches::Entity::find_by_id(existing.batch_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::BadRequest("enrollment batch not found".into()))?;

    let now = Utc::now();
    if batch.status != db::entity::common::enums::BatchStatus::Open || batch.closed_at <= now {
        return Err(ApiError::BadRequest(
            "cannot edit application after enrollment batch closed".into(),
        ));
    }

    info!(
        "[update_application] found existing app status={:?} wizard_step={:?}",
        existing.enrollment_status, existing.wizard_step
    );

    let old_json = serde_json::to_value(&existing).ok();

    let m = body.into_inner();

    info!(
        "[update_application] incoming school_id={:?} wizard_step={:?}",
        m.school_id, m.wizard_step
    );

    let active = applications::ActiveModel {
        id: Set(id),
        school_id: Set(m.school_id.or(existing.school_id)),
        child_id: Set(m.child_id.unwrap_or(existing.child_id)),
        guardian_id: Set(m.guardian_id.unwrap_or(existing.guardian_id)),
        wizard_step: Set(m.wizard_step.or(existing.wizard_step)),
        category: Set(m.category.or(existing.category)),
        overseas_arrival_date: Set(m.overseas_arrival_date.or(existing.overseas_arrival_date)),
        submission_method: Set(m.submission_method.or(existing.submission_method)),
        interview_date: Set(m.interview_date.or(existing.interview_date)),
        interview_completed: Set(m.interview_completed.unwrap_or(existing.interview_completed)),
        alternative_age_certificate: Set(m.alternative_age_certificate.unwrap_or(existing.alternative_age_certificate)),
        alternative_age_certificate_ref: Set(m.alternative_age_certificate_ref.or(existing.alternative_age_certificate_ref)),
        birth_certificate_verified: Set(m.birth_certificate_verified.unwrap_or(existing.birth_certificate_verified)),
        age_eligibility_verified: Set(m.age_eligibility_verified.unwrap_or(existing.age_eligibility_verified)),
        residence_verified: Set(m.residence_verified.unwrap_or(existing.residence_verified)),
        category_verified: Set(m.category_verified.unwrap_or(existing.category_verified)),
        rejection_reason: Set(m.rejection_reason.or(existing.rejection_reason)),
        updated_at: Set(Utc::now()),
        updated_by: Set(auth.user_id),
        reference_no: Set(existing.reference_no.clone()),
        batch_id: Set(existing.batch_id),
        total_marks: Set(existing.total_marks),
        rank_number: Set(existing.rank_number),
        list_category: Set(existing.list_category),
        enrollment_status: Set(existing.enrollment_status),
        waiting_position: Set(existing.waiting_position),
        promoted_at: Set(existing.promoted_at),
        submitted_at: Set(existing.submitted_at),
        verified_at: Set(existing.verified_at),
        verified_by: Set(existing.verified_by),
        finalized_at: Set(existing.finalized_at),
        ip_address: Set(existing.ip_address.clone()),
        user_agent: Set(existing.user_agent.clone()),
        created_at: Set(existing.created_at),
        created_by: Set(existing.created_by),
        preferred_school_ids: Set(existing.preferred_school_ids.clone()),
        electoral_year: Set(existing.electoral_year),
        polling_district: Set(existing.polling_district.clone()),
        gn_division: Set(existing.gn_division.clone()),
        polling_area: Set(existing.polling_area.clone()),
        voter_names: Set(existing.voter_names.clone()),
        household_head_name: Set(existing.household_head_name.clone()),
        declaration_agreed: Set(existing.declaration_agreed),
        declaration_signed_at: Set(existing.declaration_signed_at),
        deleted_at: Set(existing.deleted_at),
    };

    let saved = active.update(db.as_ref()).await?;
    info!(
        "[update_application] updated successfully wizard_step={:?}",
        saved.wizard_step
    );
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
