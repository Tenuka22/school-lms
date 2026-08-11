use apistos::ApiComponent;
use schemars::JsonSchema;
use serde::Serialize;

#[derive(Serialize, JsonSchema, ApiComponent)]
pub struct MessageResponse {
    pub message: String,
}
