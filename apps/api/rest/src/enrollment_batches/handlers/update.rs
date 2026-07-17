use actix_web::{HttpResponse, web};
use db::entity::enrollment_batches;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use serde_json::Value;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

fn merge_json(base: Value, patch: Value) -> Value {
    match (base, patch) {
        (Value::Object(mut base), Value::Object(patch)) => {
            for (k, v) in patch {
                base.insert(k, v);
            }
            Value::Object(base)
        }
        (_, patch) => patch,
    }
}

#[utoipa::path(
    put,
    path = "/api/enrollment-batches/{id}",
    params(
        ("id" = Uuid, Path, description = "Batch ID"),
    ),
    responses(
        (status = 200, description = "Batch updated"),
        (status = 400, description = "Bad request", body = crate::error::ErrorResponse),
        (status = 403, description = "Insufficient permissions", body = crate::error::ErrorResponse),
        (status = 404, description = "Batch not found", body = crate::error::ErrorResponse),
        (status = 409, description = "Conflict", body = crate::error::ErrorResponse),
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
    body: web::Json<Value>,
) -> Result<HttpResponse, ApiError> {
    auth.require_permission(Permission::All)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();
    let body = body.into_inner();

    let existing = enrollment_batches::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("batch not found".into()))?;

    if let Some(ref map) = body.as_object() {
        if let Some(Value::String(code)) = map.get("batch_code") {
            if *code != existing.batch_code {
                let dup = enrollment_batches::Entity::find()
                    .filter(enrollment_batches::Column::BatchCode.eq(code))
                    .one(db.as_ref())
                    .await?
                    .is_some();
                if dup {
                    return Err(ApiError::Conflict(format!("batch code '{code}' already exists")));
                }
            }
        }
    }

    let existing_json = serde_json::to_value(&existing)
        .map_err(|_| ApiError::Internal("serialization error".into()))?;

    let merged = merge_json(existing_json, body);

    let mut updated: enrollment_batches::Model = serde_json::from_value(merged)
        .map_err(|e| ApiError::BadRequest(format!("invalid batch data: {e}")))?;

    updated.id = id;
    updated.created_at = existing.created_at;
    updated.created_by = existing.created_by;

    let active: enrollment_batches::ActiveModel = updated.into();
    let saved = active.update(db.as_ref()).await?;

    Ok(HttpResponse::Ok().json(saved))
}
