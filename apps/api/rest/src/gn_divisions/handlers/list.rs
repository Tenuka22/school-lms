use actix_web::web::Json;
use apistos::api_operation;
use schemars::JsonSchema;
use serde::Serialize;

use crate::gn_divisions::GN_DIVISIONS;

#[derive(Serialize, Clone, JsonSchema, apistos::ApiComponent)]
pub struct GnDivisionEntry {
    pub id: String,
    pub name_local: String,
    pub name_en: String,
    pub slug: String,
    pub lat: f64,
    pub lon: f64,
    pub parent_id: String,
    pub parent_name_en: String,
    pub parent_name_local: String,
    pub postal_code: String,
}

#[api_operation(tag = "gn_divisions", operation_id = "list-gn-divisions")]
pub async fn list_gn_divisions() -> Json<Vec<GnDivisionEntry>> {
    Json(GN_DIVISIONS.clone())
}
