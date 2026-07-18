use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::g1_enrollments;
use sea_orm::{DatabaseConnection, EntityTrait};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "g1-enrollments", operation_id = "get-enrollment")]
pub async fn get_enrollment(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<g1_enrollments::Model>, ApiError> {
    auth.require_permission(Permission::All)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let enrollment = g1_enrollments::Entity::find_by_id(id.into_inner())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("enrollment not found".into()))?;

    Ok(Json(enrollment))
}
