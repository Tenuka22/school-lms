use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::actix::CreatedJson;
use apistos::api_operation;
use db::domain::batch::{Batch, Open};
use db::entity::enrollment_batches;
use db::entity::enums::EnrollmentType;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use serde::Deserialize;

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
    pub proximity_percentage: Option<i16>,
    pub staff_percentage: Option<i16>,
    pub sibling_percentage: Option<i16>,
    pub alumni_percentage: Option<i16>,
    pub govt_percentage: Option<i16>,
    pub special_percentage: Option<i16>,
    pub buddhism_percentage: Option<i16>,
    pub catholicism_percentage: Option<i16>,
    pub islam_percentage: Option<i16>,
    pub hinduism_percentage: Option<i16>,
}

#[api_operation(tag = "enrollment-batches", operation_id = "create-batch")]
pub async fn create_batch(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<CreateBatchBody>,
) -> Result<CreatedJson<enrollment_batches::Model>, ApiError> {
    auth.require_permission(Permission::EnrollmentBatchCreate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let mut input = body.into_inner();
    crate::validation::Year::new(input.year)?;
    input.proximity_percentage = input
        .proximity_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    input.staff_percentage = input
        .staff_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    input.sibling_percentage = input
        .sibling_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    input.alumni_percentage = input
        .alumni_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    input.govt_percentage = input
        .govt_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    input.special_percentage = input
        .special_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    input.buddhism_percentage = input
        .buddhism_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    input.catholicism_percentage = input
        .catholicism_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    input.islam_percentage = input
        .islam_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    input.hinduism_percentage = input
        .hinduism_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;

    let pcts = [
        input.proximity_percentage.unwrap_or(50),
        input.staff_percentage.unwrap_or(25),
        input.sibling_percentage.unwrap_or(14),
        input.alumni_percentage.unwrap_or(6),
        input.govt_percentage.unwrap_or(4),
        input.special_percentage.unwrap_or(1),
    ];
    crate::validation::Percentage::sum(&pcts)?;

    let religion_pcts = [
        input.buddhism_percentage.unwrap_or(74),
        input.catholicism_percentage.unwrap_or(12),
        input.islam_percentage.unwrap_or(14),
        input.hinduism_percentage.unwrap_or(0),
    ];
    crate::validation::Percentage::sum(&religion_pcts)?;
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

    let batch = Batch::<Open>::new(input.year, batch_code, batch_name);
    let mut model = batch.model;
    model.enrollment_type = input.enrollment_type;
    model.student_allocation = input.student_allocation.unwrap_or(200);
    model.proximity_percentage = pcts[0];
    model.staff_percentage = pcts[1];
    model.sibling_percentage = pcts[2];
    model.alumni_percentage = pcts[3];
    model.govt_percentage = pcts[4];
    model.special_percentage = pcts[5];
    model.buddhism_percentage = religion_pcts[0];
    model.catholicism_percentage = religion_pcts[1];
    model.islam_percentage = religion_pcts[2];
    model.hinduism_percentage = religion_pcts[3];

    let active: enrollment_batches::ActiveModel = model.into();
    let saved = active.insert(db.as_ref()).await?;

    Ok(CreatedJson(saved))
}
