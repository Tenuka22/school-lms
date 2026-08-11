use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::actix::CreatedJson;
use apistos::api_operation;
use chrono::Utc;
use db::entity::common::past_pupil_details;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, DatabaseConnection, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct CreatePastPupilDetailBody {
    pub guardian_id: Uuid,
    pub school_id: Uuid,
    pub student_id: Option<String>,
    pub highest_grade: Option<String>,
    pub year_left: Option<i16>,
    pub left_reason: Option<String>,
    pub verification_method: Option<String>,
}

#[api_operation(tag = "past-pupil-details", operation_id = "create-past-pupil-detail")]
pub async fn create_past_pupil_detail(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<CreatePastPupilDetailBody>,
) -> Result<CreatedJson<past_pupil_details::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationCreate)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let mut input = body.into_inner();
    input.student_id = input
        .student_id
        .map(|v| crate::validation::NonEmpty::new(v, "student_id").map(|x| x.into_inner()))
        .transpose()?;
    input.highest_grade = input
        .highest_grade
        .map(|v| crate::validation::NonEmpty::new(v, "highest_grade").map(|x| x.into_inner()))
        .transpose()?;
    input.left_reason = input
        .left_reason
        .map(|v| crate::validation::NonEmpty::new(v, "left_reason").map(|x| x.into_inner()))
        .transpose()?;
    input.verification_method = input
        .verification_method
        .map(|v| crate::validation::NonEmpty::new(v, "verification_method").map(|x| x.into_inner()))
        .transpose()?;

    let data = past_pupil_details::ActiveModel {
        id: Set(Uuid::new_v4()),
        guardian_id: Set(input.guardian_id),
        school_id: Set(input.school_id),
        student_id: Set(input.student_id),
        highest_grade: Set(input.highest_grade),
        year_left: Set(input.year_left),
        left_reason: Set(input.left_reason),
        verified: Set(false),
        verification_method: Set(input.verification_method),
        created_at: Set(Utc::now()),
    };

    let saved = data.insert(db.as_ref()).await?;
    Ok(CreatedJson(saved))
}
