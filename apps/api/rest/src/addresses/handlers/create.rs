use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::actix::CreatedJson;
use apistos::api_operation;
use chrono::Utc;
use db::entity::common::addresses;
use db::entity::common::enums::{ResidenceType, AuditOperation};
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

    let mut input = body.into_inner();

    input.address_line_1 =
        crate::validation::NonEmpty::new(input.address_line_1, "address_line_1")?.into_inner();
    input.city = crate::validation::NonEmpty::new(input.city, "city")?.into_inner();
    input.district =
        crate::validation::NonEmpty::new(input.district, "district")?.into_inner();
    input.province =
        crate::validation::NonEmpty::new(input.province, "province")?.into_inner();
    input.gs_division =
        crate::validation::NonEmpty::new(input.gs_division, "gs_division")?.into_inner();
    input.postal_code = input
        .postal_code
        .map(|v| crate::validation::PostalCode::new(v).map(|x| x.into_inner()))
        .transpose()?;
    if let Some(lat) = input.latitude {
        input.latitude = Some(crate::validation::Latitude::new(lat)?.0);
    }
    if let Some(lng) = input.longitude {
        input.longitude = Some(crate::validation::Longitude::new(lng)?.0);
    }

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

    crate::audit::log_address_change(
        db.as_ref(),
        saved.id,
        AuditOperation::Insert,
        None,
        crate::audit::to_json(&saved),
        &auth,
        Some("address created".into()),
    )
    .await;

    Ok(CreatedJson(saved))
}
