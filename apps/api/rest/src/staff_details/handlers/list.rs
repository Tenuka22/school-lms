use actix_web::{web, web::Json};
use apistos::api_operation;
use apistos::ApiComponent;
use db::entity::common::staff_details;
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct ListStaffDetailsQuery {
    pub guardian_id: Option<Uuid>,
}

#[api_operation(tag = "staff-details", operation_id = "list-staff-details")]
pub async fn list_staff_details(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    query: web::Query<ListStaffDetailsQuery>,
) -> Result<Json<Vec<staff_details::Model>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let mut q = staff_details::Entity::find();

    if let Some(guardian_id) = query.guardian_id {
        q = q.filter(staff_details::Column::GuardianId.eq(guardian_id));
    }

    let items = q.all(db.as_ref()).await?;
    Ok(Json(items))
}
