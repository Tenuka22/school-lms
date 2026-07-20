use actix_web::{web, web::Json};
use apistos::actix::CreatedJson;
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::entity::enrollment_batches;
use db::entity::enums::{BatchStatus, EnrollmentType};
use schemars::JsonSchema;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;



fn generate_batch_code(enrollment_type: &EnrollmentType, year: i16) -> String {
    match enrollment_type {
        EnrollmentType::G1 => format!("G1-{year}"),
    }
}

fn generate_batch_name(enrollment_type: &EnrollmentType, year: i16) -> String {
    match enrollment_type {
        EnrollmentType::G1 => format!("Grade 1 Admission {year}"),
    }
}

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct CreateBatchBody {
    pub enrollment_type: EnrollmentType,
    pub year: i16,
    pub student_allocation: Option<i32>,
    pub proximity_weight: Option<i16>,
    pub staff_weight: Option<i16>,
    pub sibling_weight: Option<i16>,
    pub alumni_weight: Option<i16>,
    pub govt_weight: Option<i16>,
    pub special_weight: Option<i16>,
}

#[api_operation(tag = "enrollment-batches", operation_id = "create-batch")]
pub async fn create_batch(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<CreateBatchBody>,
) -> Result<CreatedJson<enrollment_batches::Model>, ApiError> {
    auth.require_permission(Permission::EnrollmentBatchCreate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let input = body.into_inner();
    let batch_code = generate_batch_code(&input.enrollment_type, input.year);
    let batch_name = generate_batch_name(&input.enrollment_type, input.year);

    let exists = enrollment_batches::Entity::find()
        .filter(enrollment_batches::Column::BatchCode.eq(&batch_code))
        .one(db.as_ref())
        .await?
        .is_some();
    if exists {
        return Err(ApiError::Conflict(format!(
            "batch code '{}' already exists",
            batch_code
        )));
    }

    let data = enrollment_batches::Model {
        id: Uuid::new_v4(),
        year: input.year,
        batch_code,
        batch_name,
        enrollment_type: input.enrollment_type,
        status: BatchStatus::Open,
        created_at: Utc::now(),
        created_by: None,
        student_allocation: input.student_allocation.unwrap_or(200),
        proximity_weight: input.proximity_weight.unwrap_or(50),
        staff_weight: input.staff_weight.unwrap_or(25),
        sibling_weight: input.sibling_weight.unwrap_or(14),
        alumni_weight: input.alumni_weight.unwrap_or(6),
        govt_weight: input.govt_weight.unwrap_or(4),
        special_weight: input.special_weight.unwrap_or(1),
    };

    let active: enrollment_batches::ActiveModel = data.into();
    let saved = active.insert(db.as_ref()).await?;

    Ok(CreatedJson(saved))
}
