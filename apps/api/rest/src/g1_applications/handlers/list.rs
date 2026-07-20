use actix_web::{web, web::Json};
use apistos::api_operation;
use apistos::ApiComponent;
use db::entity::g1::applications;
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, PaginatorTrait};
use serde::{Deserialize, Serialize};

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Deserialize, JsonSchema, ApiComponent)]
pub struct ListApplicationsQuery {
    pub page: Option<i32>,
    pub page_size: Option<i32>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub full_name: Option<String>,
    pub name_with_initials: Option<String>,
    pub gender: Option<String>,
    pub nationality: Option<String>,
    pub category: Option<String>,
    pub medium_of_instruction: Option<String>,
    pub enrollment_status: Option<String>,
    pub batch_id: Option<String>,
}

#[derive(Serialize, JsonSchema, ApiComponent)]
pub struct PaginatedApplicationsResponse {
    pub items: Vec<db::entity::g1::applications::Model>,
    pub total: i32,
}

#[api_operation(tag = "g1-applications", operation_id = "list-applications")]
pub async fn list_applications(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    params: web::Query<ListApplicationsQuery>,
) -> Result<Json<PaginatedApplicationsResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let mut query = applications::Entity::find();

    if let Some(ref name) = params.full_name {
        if !name.is_empty() {
            query = query.filter(applications::Column::FullName.contains(name));
        }
    }
    if let Some(ref initials) = params.name_with_initials {
        if !initials.is_empty() {
            query = query.filter(applications::Column::NameWithInitials.contains(initials));
        }
    }
    if let Some(ref gender) = params.gender {
        if !gender.is_empty() {
            query = query.filter(applications::Column::Gender.eq(gender.clone()));
        }
    }
    if let Some(ref nationality) = params.nationality {
        if !nationality.is_empty() {
            query = query.filter(applications::Column::Nationality.eq(nationality.clone()));
        }
    }
    if let Some(ref category) = params.category {
        if !category.is_empty() {
            query = query.filter(applications::Column::Category.eq(category.clone()));
        }
    }
    if let Some(ref medium) = params.medium_of_instruction {
        if !medium.is_empty() {
            query = query.filter(applications::Column::MediumOfInstruction.eq(medium.clone()));
        }
    }
    if let Some(ref status) = params.enrollment_status {
        if !status.is_empty() {
            query = query.filter(applications::Column::EnrollmentStatus.eq(status.clone()));
        }
    }
    if let Some(ref batch_id) = params.batch_id {
        if !batch_id.is_empty() {
            query = query.filter(applications::Column::BatchId.eq(uuid::Uuid::parse_str(batch_id).unwrap_or_default()));
        }
    }

    let sort_order = params.sort_order.clone().unwrap_or_else(|| "asc".to_string());
    let order = if sort_order.to_lowercase() == "desc" {
        sea_orm::Order::Desc
    } else {
        sea_orm::Order::Asc
    };

    if let Some(ref sort_by) = params.sort_by {
        match sort_by.as_str() {
            "full_name" => { query = query.order_by(applications::Column::FullName, order); }
            "name_with_initials" => { query = query.order_by(applications::Column::NameWithInitials, order); }
            "date_of_birth" => { query = query.order_by(applications::Column::DateOfBirth, order); }
            "gender" => { query = query.order_by(applications::Column::Gender, order); }
            "nationality" => { query = query.order_by(applications::Column::Nationality, order); }
            "category" => { query = query.order_by(applications::Column::Category, order); }
            "medium_of_instruction" => { query = query.order_by(applications::Column::MediumOfInstruction, order); }
            "enrollment_status" => { query = query.order_by(applications::Column::EnrollmentStatus, order); }
            "created_at" => { query = query.order_by(applications::Column::CreatedAt, order); }
            _ => { query = query.order_by(applications::Column::CreatedAt, sea_orm::Order::Desc); }
        }
    } else {
        query = query.order_by(applications::Column::CreatedAt, sea_orm::Order::Desc);
    }

    let page = params.page.unwrap_or(1).max(1) as u64;
    let page_size = params.page_size.unwrap_or(10).max(1) as u64;

    let paginator = query.paginate(db.as_ref(), page_size);
    let total = paginator.num_items().await? as i32;
    let items = paginator.fetch_page(page.saturating_sub(1)).await?;

    Ok(Json(PaginatedApplicationsResponse { items, total }))
}
