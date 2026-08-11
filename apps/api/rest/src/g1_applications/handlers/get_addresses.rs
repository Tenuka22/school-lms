use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::g1::{applications, join_addresses};
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use serde::Serialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct AddressEntryResponse {
    pub address_id: Uuid,
    pub address_type: String,
    pub residence_type: String,
    pub is_primary: bool,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct GetApplicationAddressesResponse {
    pub addresses: Vec<AddressEntryResponse>,
}

#[api_operation(tag = "g1-applications", operation_id = "get-application-addresses")]
pub async fn get_application_addresses(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<GetApplicationAddressesResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let app_id = id.into_inner();

    applications::Entity::find_by_id(app_id)
        .filter(applications::Column::DeletedAt.is_null())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("application not found".into()))?;

    let joins = join_addresses::Entity::find()
        .filter(join_addresses::Column::ApplicationId.eq(app_id))
        .all(db.as_ref())
        .await?;

    let addresses: Vec<AddressEntryResponse> = joins
        .into_iter()
        .map(|j| AddressEntryResponse {
            address_id: j.address_id,
            address_type: j.address_type,
            residence_type: j.residence_type,
            is_primary: j.is_primary,
        })
        .collect();

    Ok(Json(GetApplicationAddressesResponse { addresses }))
}
