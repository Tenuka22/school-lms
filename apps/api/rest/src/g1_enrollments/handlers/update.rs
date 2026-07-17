use actix_web::{HttpResponse, web};
use chrono::Utc;
use db::entity::{enrollment_batches, g1_enrollments, g1_enrollments_audit};
use db::entity::enums::AuditOperation;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
};
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
    path = "/api/g1-enrollments/{id}",
    params(
        ("id" = Uuid, Path, description = "Enrollment ID"),
    ),
    responses(
        (status = 200, description = "Enrollment updated"),
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
    body: web::Json<Value>,
) -> Result<HttpResponse, ApiError> {
    auth.require_permission(Permission::All)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();
    let body = body.into_inner();

    let existing = g1_enrollments::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("enrollment not found".into()))?;

    if let Some(ref map) = body.as_object() {
        if let Some(Value::String(batch_id_str)) = map.get("batch_id") {
            let new_batch_id = Uuid::parse_str(batch_id_str)
                .map_err(|_| ApiError::BadRequest("invalid batch_id".into()))?;
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
    }

    let existing_json = serde_json::to_value(&existing)
        .map_err(|_| ApiError::Internal("serialization error".into()))?;

    let merged = merge_json(existing_json, body);

    let mut updated: g1_enrollments::Model = serde_json::from_value(merged)
        .map_err(|e| ApiError::BadRequest(format!("invalid enrollment data: {e}")))?;

    updated.id = id;
    updated.created_at = existing.created_at;
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
