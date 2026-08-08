use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use chrono::{DateTime, NaiveDate, Utc};
use db::entity::common::enums::{
    ApplicationListCategory, G1Category, Gender, MediumOfInstruction, Nationality, EnrollmentStatus,
    Religion,
};
use db::entity::g1::{applications, children};
use schemars::JsonSchema;
use sea_orm::{
    ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    QueryOrder,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Deserialize, JsonSchema, ApiComponent)]
pub struct ListApplicationsQuery {
    pub page: Option<i32>,
    pub page_size: Option<i32>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub category: Option<String>,
    pub enrollment_status: Option<String>,
    pub batch_id: Option<String>,
}

#[derive(Serialize, JsonSchema, ApiComponent)]
pub struct ApplicationWithChild {
    pub id: Uuid,
    pub reference_no: String,
    pub school_id: Option<Uuid>,
    pub total_marks: Option<String>,
    pub rank_number: Option<i32>,
    pub list_category: Option<ApplicationListCategory>,
    pub submitted_at: Option<DateTime<Utc>>,
    pub verified_at: Option<DateTime<Utc>>,
    pub verified_by: Option<Uuid>,
    pub finalized_at: Option<DateTime<Utc>>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub child_id: Uuid,
    pub guardian_id: Uuid,
    pub batch_id: Uuid,
    pub enrollment_status: EnrollmentStatus,
    pub category: Option<G1Category>,
    pub overseas_arrival_date: Option<NaiveDate>,
    pub submission_method: Option<String>,
    pub interview_date: Option<NaiveDate>,
    pub interview_completed: bool,
    pub birth_certificate_verified: bool,
    pub age_eligibility_verified: bool,
    pub residence_verified: bool,
    pub category_verified: bool,
    pub alternative_age_certificate: bool,
    pub alternative_age_certificate_ref: Option<String>,
    pub rejection_reason: Option<String>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub wizard_step: Option<i16>,
    pub deleted_at: Option<DateTime<Utc>>,
    // Child data
    pub child_full_name: Option<String>,
    pub child_name_with_initials: Option<String>,
    pub child_date_of_birth: Option<NaiveDate>,
    pub child_gender: Option<Gender>,
    pub child_nationality: Option<Nationality>,
    pub child_religion: Option<Religion>,
    pub child_medium_of_instruction: Option<MediumOfInstruction>,
    pub child_birth_certificate_number: Option<String>,
}

#[derive(Serialize, JsonSchema, ApiComponent)]
pub struct PaginatedApplicationsResponse {
    pub items: Vec<ApplicationWithChild>,
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

    query = query.filter(applications::Column::DeletedAt.is_null());

    if let Some(ref category) = params.category {
        if !category.is_empty() {
            query = query.filter(applications::Column::Category.eq(category.clone()));
        }
    }
    if let Some(ref status) = params.enrollment_status {
        if !status.is_empty() {
            query = query.filter(applications::Column::EnrollmentStatus.eq(status.clone()));
        }
    }
    if let Some(ref batch_id) = params.batch_id {
        if !batch_id.is_empty() {
            query = query.filter(
                applications::Column::BatchId
                    .eq(uuid::Uuid::parse_str(batch_id).unwrap_or_default()),
            );
        }
    }

    let sort_order = params
        .sort_order
        .clone()
        .unwrap_or_else(|| "asc".to_string());
    let order = if sort_order.to_lowercase() == "desc" {
        sea_orm::Order::Desc
    } else {
        sea_orm::Order::Asc
    };

    if let Some(ref sort_by) = params.sort_by {
        match sort_by.as_str() {
            "category" => {
                query = query.order_by(applications::Column::Category, order);
            }
            "enrollment_status" => {
                query = query.order_by(applications::Column::EnrollmentStatus, order);
            }
            "created_at" => {
                query = query.order_by(applications::Column::CreatedAt, order);
            }
            _ => {
                query = query.order_by(applications::Column::CreatedAt, sea_orm::Order::Desc);
            }
        }
    } else {
        query = query.order_by(applications::Column::CreatedAt, sea_orm::Order::Desc);
    }

    let page = params.page.unwrap_or(1).max(1) as u64;
    let page_size = params.page_size.unwrap_or(10).max(1) as u64;

    let paginator = query.paginate(db.as_ref(), page_size);
    let total = paginator.num_items().await? as i32;
    let apps = paginator.fetch_page(page.saturating_sub(1)).await?;

    let child_ids: Vec<Uuid> = apps.iter().map(|a| a.child_id).collect();
    let children = children::Entity::find()
        .filter(children::Column::Id.is_in(child_ids))
        .all(db.as_ref())
        .await?;
    let child_map: std::collections::HashMap<Uuid, children::Model> =
        children.into_iter().map(|c| (c.id, c)).collect();

    let items: Vec<ApplicationWithChild> = apps
        .into_iter()
        .map(|app| {
            let child = child_map.get(&app.child_id);
            ApplicationWithChild {
                id: app.id,
                reference_no: app.reference_no,
                school_id: app.school_id,
                total_marks: app.total_marks.map(|m| m.to_string()),
                rank_number: app.rank_number,
                list_category: app.list_category,
                submitted_at: app.submitted_at,
                verified_at: app.verified_at,
                verified_by: app.verified_by,
                finalized_at: app.finalized_at,
                ip_address: app.ip_address,
                user_agent: app.user_agent,
                created_at: app.created_at,
                updated_at: app.updated_at,
                child_id: app.child_id,
                guardian_id: app.guardian_id,
                batch_id: app.batch_id,
                enrollment_status: app.enrollment_status,
                category: app.category,
                overseas_arrival_date: app.overseas_arrival_date,
                submission_method: app.submission_method,
                interview_date: app.interview_date,
                interview_completed: app.interview_completed,
                birth_certificate_verified: app.birth_certificate_verified,
                age_eligibility_verified: app.age_eligibility_verified,
                residence_verified: app.residence_verified,
                category_verified: app.category_verified,
                alternative_age_certificate: app.alternative_age_certificate,
                alternative_age_certificate_ref: app.alternative_age_certificate_ref,
                rejection_reason: app.rejection_reason,
                created_by: app.created_by,
                updated_by: app.updated_by,
                wizard_step: app.wizard_step,
                deleted_at: app.deleted_at,
                child_full_name: child.map(|c| c.full_name.clone()),
                child_name_with_initials: child.map(|c| c.name_with_initials.clone()),
                child_date_of_birth: child.map(|c| c.date_of_birth),
                child_gender: child.map(|c| c.gender),
                child_nationality: child.map(|c| c.nationality),
                child_religion: child.and_then(|c| c.religion.clone()),
                child_medium_of_instruction: child.map(|c| c.medium_of_instruction),
                child_birth_certificate_number: child
                    .and_then(|c| c.birth_certificate_number.clone()),
            }
        })
        .collect();

    Ok(Json(PaginatedApplicationsResponse { items, total }))
}
