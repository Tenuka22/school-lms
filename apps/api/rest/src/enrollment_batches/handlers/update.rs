use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::enrollment_batches;
use db::entity::enums::BatchStatus;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct UpdateBatchBody {
    pub status: Option<BatchStatus>,
    pub student_allocation: Option<i32>,
    pub proximity_percentage: Option<i16>,
    pub staff_percentage: Option<i16>,
    pub sibling_percentage: Option<i16>,
    pub alumni_percentage: Option<i16>,
    pub govt_percentage: Option<i16>,
    pub special_percentage: Option<i16>,
    pub buddhism_percentage: Option<i16>,
    pub catholicism_percentage: Option<i16>,
    pub islam_percentage: Option<i16>,
    pub hinduism_percentage: Option<i16>,
}

#[api_operation(tag = "enrollment-batches", operation_id = "update-batch")]
pub async fn update_batch(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: Json<UpdateBatchBody>,
) -> Result<Json<enrollment_batches::Model>, ApiError> {
    auth.require_permission(Permission::EnrollmentBatchUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();
    let mut patch = body.into_inner();

    patch.proximity_percentage = patch
        .proximity_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.staff_percentage = patch
        .staff_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.sibling_percentage = patch
        .sibling_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.alumni_percentage = patch
        .alumni_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.govt_percentage = patch
        .govt_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.special_percentage = patch
        .special_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.buddhism_percentage = patch
        .buddhism_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.catholicism_percentage = patch
        .catholicism_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.islam_percentage = patch
        .islam_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.hinduism_percentage = patch
        .hinduism_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;

    let existing = enrollment_batches::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("batch not found".into()))?;

    let pcts = [
        patch.proximity_percentage.unwrap_or(existing.proximity_percentage),
        patch.staff_percentage.unwrap_or(existing.staff_percentage),
        patch.sibling_percentage.unwrap_or(existing.sibling_percentage),
        patch.alumni_percentage.unwrap_or(existing.alumni_percentage),
        patch.govt_percentage.unwrap_or(existing.govt_percentage),
        patch.special_percentage.unwrap_or(existing.special_percentage),
    ];
    crate::validation::Percentage::sum(&pcts)?;

    let religion_pcts = [
        patch.buddhism_percentage.unwrap_or(existing.buddhism_percentage),
        patch.catholicism_percentage.unwrap_or(existing.catholicism_percentage),
        patch.islam_percentage.unwrap_or(existing.islam_percentage),
        patch.hinduism_percentage.unwrap_or(existing.hinduism_percentage),
    ];
    crate::validation::Percentage::sum(&religion_pcts)?;

    let active = enrollment_batches::ActiveModel {
        id: Set(existing.id),
        year: Set(existing.year),
        batch_code: Set(existing.batch_code),
        batch_name: Set(existing.batch_name),
        enrollment_type: Set(existing.enrollment_type),
        status: Set(patch.status.unwrap_or(existing.status)),
        opened_at: Set(existing.opened_at),
        closed_at: Set(existing.closed_at),
        list_published_at: Set(existing.list_published_at),
        appeal_deadline_at: Set(existing.appeal_deadline_at),
        finalized_at: Set(existing.finalized_at),
        created_at: Set(existing.created_at),
        created_by: Set(existing.created_by),
        student_allocation: Set(patch
            .student_allocation
            .unwrap_or(existing.student_allocation)),
        proximity_percentage: Set(pcts[0]),
        staff_percentage: Set(pcts[1]),
        sibling_percentage: Set(pcts[2]),
        alumni_percentage: Set(pcts[3]),
        govt_percentage: Set(pcts[4]),
        special_percentage: Set(pcts[5]),
        buddhism_percentage: Set(religion_pcts[0]),
        catholicism_percentage: Set(religion_pcts[1]),
        islam_percentage: Set(religion_pcts[2]),
        hinduism_percentage: Set(religion_pcts[3]),
        waiting_list_size: Set(existing.waiting_list_size),
    };

    let saved = active.update(db.as_ref()).await?;

    Ok(Json(saved))
}
