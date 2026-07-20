use actix_web::{web, web::Json};
use apistos::actix::CreatedJson;
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::entity::workspace_addresses;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, DatabaseConnection, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

fn build_full_address(input: &CreateWorkspaceAddressBody) -> String {
    let mut parts: Vec<&str> = Vec::new();
    if let Some(b) = &input.building {
        if !b.is_empty() {
            parts.push(b);
        }
    }
    parts.push(&input.street_1);
    if let Some(s) = &input.street_2 {
        if !s.is_empty() {
            parts.push(s);
        }
    }
    parts.push(&input.city);
    let mut region = String::new();
    if let Some(s) = &input.state {
        if !s.is_empty() {
            region = s.clone();
        }
    }
    if let Some(p) = &input.postal_code {
        if !p.is_empty() {
            if !region.is_empty() {
                region.push(' ');
            }
            region.push_str(p);
        }
    }
    if !region.is_empty() {
        parts.push(&region);
    }
    parts.push(&input.country);
    parts.join(", ")
}

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct CreateWorkspaceAddressBody {
    pub name: String,
    pub building: Option<String>,
    pub street_1: String,
    pub street_2: Option<String>,
    pub city: String,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub country: String,
}

#[api_operation(tag = "workspace_addresses", operation_id = "create-workspace-address")]
pub async fn create_workspace_address(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<CreateWorkspaceAddressBody>,
) -> Result<CreatedJson<workspace_addresses::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationCreate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let input = body.into_inner();
    let full_address = build_full_address(&input);

    let model = workspace_addresses::ActiveModel {
        id: Set(Uuid::new_v4()),
        name: Set(input.name),
        building: Set(input.building),
        street_1: Set(input.street_1),
        street_2: Set(input.street_2),
        city: Set(input.city),
        state: Set(input.state),
        postal_code: Set(input.postal_code),
        country: Set(input.country),
        full_address: Set(full_address),
        created_at: Set(Utc::now()),
    };

    let saved = model.insert(db.as_ref()).await?;
    Ok(CreatedJson(saved))
}
