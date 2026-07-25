use actix_web::web;
use apistos::ApiComponent;
use apistos::api_operation;
use chrono::Utc;
use db::entity::g1::{applications, join_addresses};
use log::{info, warn};
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Deserialize, JsonSchema, ApiComponent)]
pub struct AddressEntry {
    pub address_id: Uuid,
    pub address_type: String,
    pub residence_type: String,
    pub is_primary: bool,
}

#[derive(Debug, Deserialize, JsonSchema, ApiComponent)]
pub struct SaveAddressesRequest {
    pub addresses: Vec<AddressEntry>,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct SaveAddressesResponse {
    pub count: usize,
}

#[api_operation(tag = "g1-applications", operation_id = "save-addresses")]
pub async fn save_addresses(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: web::Json<SaveAddressesRequest>,
) -> Result<web::Json<SaveAddressesResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let app_id = id.into_inner();
    let user_id = auth.user_id;

    info!(
        "[save_addresses] user={user_id:?} app={app_id} addr_count={}",
        body.addresses.len()
    );

    applications::Entity::find_by_id(app_id)
        .filter(applications::Column::DeletedAt.is_null())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| {
            warn!("[save_addresses] application {app_id} not found");
            ApiError::NotFound("Application not found".into())
        })?;

    let deleted = join_addresses::Entity::delete_many()
        .filter(join_addresses::Column::ApplicationId.eq(app_id))
        .exec(db.as_ref())
        .await?;

    info!("[save_addresses] deleted {deleted:?} existing join rows for app {app_id}");

    let mut count = 0;
    for entry in &body.addresses {
        info!(
            "[save_addresses] inserting join address_id={} address_type={} residence_type={} is_primary={}",
            entry.address_id, entry.address_type, entry.residence_type, entry.is_primary
        );
        join_addresses::ActiveModel {
            id: Set(Uuid::new_v4()),
            application_id: Set(app_id),
            address_id: Set(entry.address_id),
            address_type: Set(entry.address_type.clone()),
            residence_type: Set(entry.residence_type.clone()),
            is_primary: Set(entry.is_primary),
            created_at: Set(Utc::now()),
        }
        .insert(db.as_ref())
        .await?;
        count += 1;
    }

    info!("[save_addresses] success count={}", count);

    Ok(web::Json(SaveAddressesResponse { count }))
}
