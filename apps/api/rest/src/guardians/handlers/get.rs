use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::guardians;
use sea_orm::{DatabaseConnection, EntityTrait};
use uuid::Uuid;
use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "guardians", operation_id = "get-guardian")]
pub async fn get_guardian(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<guardians::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let guardian = guardians::Entity::find_by_id(id.into_inner())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("guardian not found".into()))?;

    Ok(Json(guardian))
}
