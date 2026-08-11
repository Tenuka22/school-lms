use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::g1::children;
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter};
use serde::Deserialize;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, ApiComponent, JsonSchema)]
pub struct ListChildrenQuery {
    pub search: Option<String>,
    pub birth_certificate_number: Option<String>,
    pub nic: Option<String>,
    pub full_name: Option<String>,
    /// Filter by student status: "true" = has student record, "false" = no student record
    pub has_student: Option<String>,
}

#[api_operation(tag = "children", operation_id = "list-children")]
pub async fn list_children(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    query: web::Query<ListChildrenQuery>,
) -> Result<Json<Vec<children::Model>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let search = query.search.as_deref().unwrap_or("").trim();
    let bc = query
        .birth_certificate_number
        .as_deref()
        .unwrap_or("")
        .trim();
    let nic = query.nic.as_deref().unwrap_or("").trim();
    let name = query.full_name.as_deref().unwrap_or("").trim();

    let mut filter = children::Entity::find();

    if !bc.is_empty() {
        filter = filter.filter(children::Column::BirthCertificateNumber.eq(bc));
    }

    if !nic.is_empty() {
        filter = filter.filter(children::Column::Nic.eq(nic));
    }

    if !name.is_empty() {
        filter = filter.filter(children::Column::FullName.eq(name));
    }

    if !search.is_empty() {
        filter = filter.filter(
            Condition::any()
                .add(children::Column::FullName.contains(search))
                .add(children::Column::NameWithInitials.contains(search))
                .add(children::Column::BirthCertificateNumber.contains(search))
                .add(children::Column::Nic.contains(search)),
        );
    }

    // Filter by student status
    match query.has_student.as_deref() {
        Some("true") => filter = filter.filter(children::Column::StudentId.is_not_null()),
        Some("false") => filter = filter.filter(children::Column::StudentId.is_null()),
        _ => {}
    }

    let items = filter.all(db.as_ref()).await?;
    Ok(Json(items))
}
