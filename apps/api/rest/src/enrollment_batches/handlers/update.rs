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
    pub proximity_weight: Option<i16>,
    pub staff_weight: Option<i16>,
    pub sibling_weight: Option<i16>,
    pub alumni_weight: Option<i16>,
    pub govt_weight: Option<i16>,
    pub special_weight: Option<i16>,
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
    let patch = body.into_inner();

    let existing = enrollment_batches::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("batch not found".into()))?;

    let active = enrollment_batches::ActiveModel {
        id: Set(existing.id),
        year: Set(existing.year),
        batch_code: Set(existing.batch_code),
        batch_name: Set(existing.batch_name),
        enrollment_type: Set(existing.enrollment_type),
        status: Set(patch.status.unwrap_or(existing.status)),
        created_at: Set(existing.created_at),
        created_by: Set(existing.created_by),
        student_allocation: Set(patch
            .student_allocation
            .unwrap_or(existing.student_allocation)),
        proximity_weight: Set(patch.proximity_weight.unwrap_or(existing.proximity_weight)),
        staff_weight: Set(patch.staff_weight.unwrap_or(existing.staff_weight)),
        sibling_weight: Set(patch.sibling_weight.unwrap_or(existing.sibling_weight)),
        alumni_weight: Set(patch.alumni_weight.unwrap_or(existing.alumni_weight)),
        govt_weight: Set(patch.govt_weight.unwrap_or(existing.govt_weight)),
        special_weight: Set(patch.special_weight.unwrap_or(existing.special_weight)),
    };

    let saved = active.update(db.as_ref()).await?;

    Ok(Json(saved))
}
