use actix_web::{web, web::Json};
use apistos::api_operation;
use apistos::ApiComponent;
use db::entity::enrollment_batches;
use db::entity::enums::BatchStatus;
use schemars::JsonSchema;
use sea_orm::{
    ActiveModelTrait, DatabaseConnection, EntityTrait, Set,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct UpdateBatchBody {
    pub status: BatchStatus,
}

#[api_operation(tag = "enrollment-batches", operation_id = "update-batch")]
pub async fn update_batch(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: Json<UpdateBatchBody>,
) -> Result<Json<enrollment_batches::Model>, ApiError> {
    auth.require_permission(Permission::All)
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
        status: Set(patch.status),
        created_at: Set(existing.created_at),
        created_by: Set(existing.created_by),
    };

    let saved = active.update(db.as_ref()).await?;

    Ok(Json(saved))
}
