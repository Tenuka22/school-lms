use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::actix::CreatedJson;
use apistos::api_operation;
use chrono::Utc;
use db::entity::common::addresses;
use db::entity::common::enums::ResidenceType;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, DatabaseConnection, Set};
use serde::Deserialize;
use num_traits::FromPrimitive;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct CreateAddressBody {
    pub address_line_1: String,
    pub address_line_2: Option<String>,
    pub city: String,
    pub district: String,
    pub province: String,
    pub gs_division: String,
    pub postal_code: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub distance_to_school_km: Option<f64>,
    pub verified_by_map: Option<bool>,
    pub residence_type: Option<String>,
    pub ownership_proof: Option<String>,
}

fn parse_residence_type(value: Option<String>) -> Option<ResidenceType> {
    value.and_then(|v| match v.as_str() {
        "Owned" => Some(ResidenceType::Owned),
        "Rented" => Some(ResidenceType::Rented),
        "Relative" => Some(ResidenceType::Relative),
        "Other" => Some(ResidenceType::Other),
        _ => None,
    })
}

#[api_operation(tag = "addresses", operation_id = "create-address")]
pub async fn create_address(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<CreateAddressBody>,
) -> Result<CreatedJson<addresses::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationCreate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let input = body.into_inner();

    let model = addresses::ActiveModel {
        id: Set(Uuid::new_v4()),
        address_line_1: Set(input.address_line_1),
        address_line_2: Set(input.address_line_2),
        city: Set(input.city),
        district: Set(input.district),
        province: Set(input.province),
        gs_division: Set(input.gs_division),
        postal_code: Set(input.postal_code),
        latitude: Set(
            input.latitude.and_then(sea_orm::prelude::Decimal::from_f64),
        ),
        longitude: Set(
            input.longitude.and_then(sea_orm::prelude::Decimal::from_f64),
        ),
        distance_to_school_km: Set(
            input
                .distance_to_school_km
                .and_then(sea_orm::prelude::Decimal::from_f64),
        ),
        verified_by_map: Set(input.verified_by_map.unwrap_or(false)),
        residence_type: Set(parse_residence_type(input.residence_type)),
        ownership_proof: Set(input.ownership_proof),
        created_at: Set(Utc::now()),
    };

    let saved = model.insert(db.as_ref()).await?;
    Ok(CreatedJson(saved))
}
