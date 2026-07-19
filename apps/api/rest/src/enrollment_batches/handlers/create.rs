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
}

#[api_operation(tag = "enrollment-batches", operation_id = "create-batch")]
pub async fn create_batch(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<CreateBatchBody>,
) -> Result<CreatedJson<enrollment_batches::Model>, ApiError> {
    auth.require_permission(Permission::All)
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
        student_allocation: 200,
        proximity_weight: 50,
        staff_weight: 25,
        sibling_weight: 14,
        alumni_weight: 6,
        govt_weight: 4,
        special_weight: 1,
    };

    let active: enrollment_batches::ActiveModel = data.into();
    let saved = active.insert(db.as_ref()).await?;

    Ok(CreatedJson(saved))
}
