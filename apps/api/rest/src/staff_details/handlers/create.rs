use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::actix::CreatedJson;
use apistos::api_operation;
use chrono::Utc;
use db::entity::common::enums::StaffType;
use db::entity::common::staff_details;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, DatabaseConnection, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct CreateStaffDetailBody {
    pub guardian_id: Uuid,
    pub school_id: Uuid,
    pub staff_type: Option<StaffType>,
    pub employee_id: Option<String>,
    pub designation: Option<String>,
}

#[api_operation(tag = "staff-details", operation_id = "create-staff-detail")]
pub async fn create_staff_detail(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<CreateStaffDetailBody>,
) -> Result<CreatedJson<staff_details::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationCreate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let mut input = body.into_inner();
    input.employee_id = input
        .employee_id
        .map(|v| crate::validation::NonEmpty::new(v, "employee_id").map(|x| x.into_inner()))
        .transpose()?;
    input.designation = input
        .designation
        .map(|v| crate::validation::NonEmpty::new(v, "designation").map(|x| x.into_inner()))
        .transpose()?;

    let data = staff_details::ActiveModel {
        id: Set(Uuid::new_v4()),
        guardian_id: Set(input.guardian_id),
        school_id: Set(input.school_id),
        staff_type: Set(input.staff_type),
        employee_id: Set(input.employee_id),
        designation: Set(input.designation),
        employment_type: Set(None),
        service_start_date: Set(None),
        service_end_date: Set(None),
        is_current: Set(true),
        verification_doc: Set(None),
        distance_from_residence_km: Set(None),
        created_at: Set(Utc::now()),
    };

    let saved = data.insert(db.as_ref()).await?;
    Ok(CreatedJson(saved))
}
