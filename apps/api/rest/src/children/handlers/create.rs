use actix_web::{web, web::Json};
use apistos::actix::CreatedJson;
use apistos::api_operation;
use chrono::Utc;
use db::entity::g1::children;
use sea_orm::{ActiveModelTrait, DatabaseConnection};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "children", operation_id = "create-child")]
pub async fn create_child(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<children::Model>,
) -> Result<CreatedJson<children::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationCreate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let mut data = body.into_inner();
    data.id = Uuid::new_v4();
    data.created_at = Utc::now();

    let active: children::ActiveModel = data.into();
    let saved = active.insert(db.as_ref()).await?;

    Ok(CreatedJson(saved))
}
