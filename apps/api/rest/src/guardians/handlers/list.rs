use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::guardians;
use sea_orm::{DatabaseConnection, EntityTrait};
use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "guardians", operation_id = "list-guardians")]
pub async fn list_guardians(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
) -> Result<Json<Vec<guardians::Model>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let guardians = guardians::Entity::find().all(db.as_ref()).await?;
    Ok(Json(guardians))
}
