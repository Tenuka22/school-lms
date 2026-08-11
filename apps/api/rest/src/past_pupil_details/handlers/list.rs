use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::common::past_pupil_details;
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct ListPastPupilDetailsQuery {
    pub guardian_id: Option<Uuid>,
}

#[api_operation(tag = "past-pupil-details", operation_id = "list-past-pupil-details")]
pub async fn list_past_pupil_details(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    query: web::Query<ListPastPupilDetailsQuery>,
) -> Result<Json<Vec<past_pupil_details::Model>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let mut q = past_pupil_details::Entity::find();

    if let Some(guardian_id) = query.guardian_id {
        q = q.filter(past_pupil_details::Column::GuardianId.eq(guardian_id));
    }

    let items = q.all(db.as_ref()).await?;
    Ok(Json(items))
}
