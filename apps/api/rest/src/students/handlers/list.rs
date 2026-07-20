use actix_web::{web, web::Json};
use apistos::api_operation;
use apistos::ApiComponent;
use db::entity::student::student;
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QuerySelect};
use serde::Deserialize;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct ListStudentsQuery {
    pub search: Option<String>,
}

#[api_operation(tag = "students", operation_id = "list-students")]
pub async fn list_students(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    query: web::Query<ListStudentsQuery>,
) -> Result<Json<Vec<student::Model>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let mut q = student::Entity::find().limit(20);

    if let Some(search) = &query.search {
        let pattern = format!("%{}%", search);
        q = q.filter(
            sea_orm::Condition::any()
                .add(student::Column::FullName.ilike(&pattern))
                .add(student::Column::AdmissionNumber.ilike(&pattern)),
        );
    }

    let items = q.all(db.as_ref()).await?;
    Ok(Json(items))
}
