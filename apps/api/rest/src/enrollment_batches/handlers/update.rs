use actix_web::{HttpResponse, web};
use db::entity::enrollment_batches;
use db::entity::enums::BatchStatus;
use sea_orm::{
    ActiveModelTrait, DatabaseConnection, EntityTrait,
};
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, ToSchema)]
pub struct UpdateBatchBody {
    pub status: BatchStatus,
}

#[utoipa::path(
    put,
    path = "/api/enrollment-batches/{id}",
    request_body = UpdateBatchBody,
    params(
        ("id" = Uuid, Path, description = "Batch ID"),
    ),
    responses(
        (status = 200, description = "Batch updated", body = enrollment_batches::Model),
        (status = 400, description = "Bad request", body = crate::error::ErrorResponse),
        (status = 403, description = "Insufficient permissions", body = crate::error::ErrorResponse),
        (status = 404, description = "Batch not found", body = crate::error::ErrorResponse),
        (status = 500, description = "Internal server error", body = crate::error::ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn update_batch(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: web::Json<UpdateBatchBody>,
) -> Result<HttpResponse, ApiError> {
    auth.require_permission(Permission::All)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();
    let patch = body.into_inner();

    let existing = enrollment_batches::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("batch not found".into()))?;

    let mut updated = existing.clone();
    updated.status = patch.status;

    let active: enrollment_batches::ActiveModel = updated.into();
    let saved = active.update(db.as_ref()).await?;

    Ok(HttpResponse::Ok().json(saved))
}
