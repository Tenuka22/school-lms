use actix_web::{web, web::Json};
use apistos::api_operation;
use apistos::ApiComponent;
use db::entity::g1::{applications, join_guardians};
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use serde::Serialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct GetApplicationGuardiansResponse {
    pub guardian_ids: Vec<Uuid>,
}

#[api_operation(tag = "g1-applications", operation_id = "get-application-guardians")]
pub async fn get_application_guardians(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<GetApplicationGuardiansResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let app_id = id.into_inner();

    applications::Entity::find_by_id(app_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("application not found".into()))?;

    let joins = join_guardians::Entity::find()
        .filter(join_guardians::Column::ApplicationId.eq(app_id))
        .all(db.as_ref())
        .await?;

    let ids: Vec<Uuid> = joins.into_iter().map(|j| j.guardian_id).collect();

    Ok(Json(GetApplicationGuardiansResponse { guardian_ids: ids }))
}
