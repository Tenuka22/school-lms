use apistos::ApiComponent;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Serialize, JsonSchema, ApiComponent)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
}

#[derive(Serialize, JsonSchema, ApiComponent)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
}
