use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::workspace_addresses;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "workspace_addresses", operation_id = "get-workspace-address")]
pub async fn get_workspace_address(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    path: web::Path<Uuid>,
) -> Result<Json<workspace_addresses::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationCreate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = path.into_inner();
    let address = workspace_addresses::Entity::find()
        .filter(workspace_addresses::Column::Id.eq(id))
        .one(db.as_ref())
        .await?
        .ok_or(ApiError::NotFound("workspace address not found".into()))?;

    Ok(Json(address))
}
