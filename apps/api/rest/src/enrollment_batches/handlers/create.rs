use actix_web::{HttpResponse, web};
use chrono::Utc;
use db::entity::enrollment_batches;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[utoipa::path(
    post,
    path = "/api/enrollment-batches",
    responses(
        (status = 201, description = "Batch created"),
        (status = 400, description = "Bad request", body = crate::error::ErrorResponse),
        (status = 403, description = "Insufficient permissions", body = crate::error::ErrorResponse),
        (status = 409, description = "Conflict", body = crate::error::ErrorResponse),
        (status = 500, description = "Internal server error", body = crate::error::ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn create_batch(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: web::Json<enrollment_batches::Model>,
) -> Result<HttpResponse, ApiError> {
    auth.require_permission(Permission::All)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let mut data = body.into_inner();

    let exists = enrollment_batches::Entity::find()
        .filter(enrollment_batches::Column::BatchCode.eq(&data.batch_code))
        .one(db.as_ref())
        .await?
        .is_some();
    if exists {
        return Err(ApiError::Conflict(format!(
            "batch code '{}' already exists",
            data.batch_code
        )));
    }

    data.id = Uuid::new_v4();
    data.created_at = Utc::now();
    data.created_by = None;

    let active: enrollment_batches::ActiveModel = data.into();
    let saved = active.insert(db.as_ref()).await?;

    Ok(HttpResponse::Created().json(saved))
}
