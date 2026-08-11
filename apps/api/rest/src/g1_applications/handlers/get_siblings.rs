use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::common::siblings;
use db::entity::g1::{applications, join_siblings};
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use serde::Serialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct GetApplicationSiblingsResponse {
    pub sibling_ids: Vec<Uuid>,
}

#[api_operation(tag = "g1-applications", operation_id = "get-application-siblings")]
pub async fn get_application_siblings(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<GetApplicationSiblingsResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let app_id = id.into_inner();

    applications::Entity::find_by_id(app_id)
        .filter(applications::Column::DeletedAt.is_null())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::not_found("application not found"))?;

    // Get the join rows → siblings → student IDs
    let joins = join_siblings::Entity::find()
        .filter(join_siblings::Column::ApplicationId.eq(app_id))
        .all(db.as_ref())
        .await?;

    let sibling_ids: Vec<Uuid> = joins.iter().map(|j| j.sibling_id).collect();

    let student_ids = if sibling_ids.is_empty() {
        vec![]
    } else {
        siblings::Entity::find()
            .filter(siblings::Column::Id.is_in(sibling_ids))
            .all(db.as_ref())
            .await?
            .into_iter()
            .map(|s| s.student_id)
            .collect()
    };

    Ok(Json(GetApplicationSiblingsResponse {
        sibling_ids: student_ids,
    }))
}
