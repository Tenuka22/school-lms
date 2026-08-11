use actix_web::web;
use apistos::api_operation;
use db::entity::common::blacklist;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "blacklist", operation_id = "list-blacklist")]
pub async fn list_blacklist(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    query: web::Query<ListBlacklistQuery>,
) -> Result<web::Json<Vec<blacklist::Model>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let mut filter = blacklist::Entity::find().filter(blacklist::Column::Status.eq("Active"));

    if let Some(ref ids) = query.guardian_ids {
        if !ids.is_empty() {
            filter = filter.filter(blacklist::Column::GuardianId.is_in(ids.clone()));
        }
    }

    let entries = filter.all(db.as_ref()).await?;
    Ok(web::Json(entries))
}

#[derive(Debug, serde::Deserialize, schemars::JsonSchema, apistos::ApiComponent)]
pub struct ListBlacklistQuery {
    pub guardian_ids: Option<Vec<Uuid>>,
}
