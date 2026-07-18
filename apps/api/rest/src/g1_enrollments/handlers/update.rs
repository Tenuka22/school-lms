use actix_web::{HttpResponse, web};
use chrono::Utc;
use db::entity::{enrollment_batches, g1_enrollments, g1_enrollments_audit};
use db::entity::enums::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
};
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, ToSchema)]
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

#[utoipa::path(
    put,
    path = "/api/g1-enrollments/{id}",
    request_body = UpdateG1EnrollmentBody,
    params(
        ("id" = Uuid, Path, description = "Enrollment ID"),
    ),
    responses(
        (status = 200, description = "Enrollment updated", body = g1_enrollments::Model),
        (status = 400, description = "Bad request", body = crate::error::ErrorResponse),
        (status = 403, description = "Insufficient permissions", body = crate::error::ErrorResponse),
        (status = 404, description = "Enrollment not found", body = crate::error::ErrorResponse),
        (status = 500, description = "Internal server error", body = crate::error::ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn update_enrollment(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: web::Json<UpdateG1EnrollmentBody>,
) -> Result<HttpResponse, ApiError> {
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
                return Err(ApiError::BadRequest(format!("batch {new_batch_id} not found")));
            }
        }
    }

    let mut updated = existing.clone();
    macro_rules! apply {
        ($field:ident) => {
            if let Some(v) = patch.$field {
                updated.$field = v;
            }
        };
    }
    apply!(full_name);
    apply!(name_with_initials);
    apply!(date_of_birth);
    apply!(gender);
    apply!(nationality);
    apply!(religion);
    apply!(medium_of_instruction);
    apply!(enrollment_status);
    apply!(category);
    apply!(birth_certificate_number);
    apply!(birth_certificate_verified);
    apply!(age_eligibility_verified);
    apply!(residence_verified);
    apply!(category_verified);
    apply!(submission_method);
    apply!(interview_date);
    apply!(interview_completed);
    apply!(alternative_age_certificate);
    apply!(alternative_age_certificate_ref);
    apply!(rank);
    apply!(rejection_reason);
    if let Some(batch_id) = patch.batch_id {
        updated.batch_id = batch_id;
    }

    updated.updated_at = Utc::now();
    updated.updated_by = None;

    let old_json = serde_json::to_value(&existing).ok();
    let new_json = serde_json::to_value(&updated).ok();

    let active: g1_enrollments::ActiveModel = updated.into();
    let saved = active.update(db.as_ref()).await?;

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

    Ok(HttpResponse::Ok().json(saved))
}
