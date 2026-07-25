use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::common::addresses;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "addresses", operation_id = "get-address")]
pub async fn get_address(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<Json<addresses::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = path.into_inner();
    let address = addresses::Entity::find()
        .filter(addresses::Column::Id.eq(id))
        .one(db.as_ref())
        .await?
        .ok_or(ApiError::NotFound("address not found".into()))?;

    Ok(Json(address))
}
