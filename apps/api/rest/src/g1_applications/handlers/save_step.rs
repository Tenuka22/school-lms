use actix_web::web;
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::entity::g1::applications;
use log::info;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Deserialize, Serialize, JsonSchema, ApiComponent)]
pub struct SaveStepRequest {
    pub wizard_step: i16,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct SaveStepResponse {
    pub wizard_step: i16,
}

#[api_operation(tag = "g1-applications", operation_id = "save-wizard-step")]
pub async fn save_wizard_step(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: web::Json<SaveStepRequest>,
) -> Result<web::Json<SaveStepResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let app_id = id.into_inner();
    let step = body.wizard_step;

    info!("[save_wizard_step] user={:?} app={app_id} step={step}", auth.user_id);

    let existing = applications::Entity::find_by_id(app_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| {
            info!("[save_wizard_step] application {app_id} not found");
            ApiError::NotFound("Application not found".into())
        })?;

    info!("[save_wizard_step] current wizard_step={:?} -> setting to {step}", existing.wizard_step);

    let mut active: applications::ActiveModel = existing.into();
    active.wizard_step = Set(Some(step));
    active.updated_at = Set(Utc::now());

    active.update(db.as_ref()).await?;

    info!("[save_wizard_step] saved successfully");

    Ok(web::Json(SaveStepResponse { wizard_step: step }))
}
