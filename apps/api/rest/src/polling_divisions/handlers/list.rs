use actix_web::web::Json;
use apistos::api_operation;
use schemars::JsonSchema;
use serde::Serialize;

use crate::polling_divisions::POLLING_DIVISIONS;

#[derive(Serialize, Clone, JsonSchema, apistos::ApiComponent)]
pub struct PollingDivisionEntry {
    pub value: String,
    pub label: String,
    pub si: String,
    pub district: String,
}

#[api_operation(tag = "polling_divisions", operation_id = "list-polling-divisions")]
pub async fn list_polling_divisions() -> Json<Vec<PollingDivisionEntry>> {
    Json(POLLING_DIVISIONS.clone())
}
