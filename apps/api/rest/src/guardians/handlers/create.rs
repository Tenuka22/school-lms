use actix_web::{web, web::Json};
use apistos::actix::CreatedJson;
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::entity::common::enums::StaffType;
use db::entity::common::enums::IncomeLevel;
use db::entity::common::past_pupil_details;
use db::entity::common::staff_details;
use db::entity::guardians;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, DatabaseConnection, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct CreateGuardianBody {
    pub relationship_type: String,
    pub full_name: String,
    pub nic_number: String,
    pub contact_phone: String,
    pub contact_email: Option<String>,
    pub occupation: Option<String>,
    pub workplace_name: Option<String>,
    pub workplace_address: Option<String>,
    pub is_govt_employee: bool,
    pub govt_service_years: Option<i32>,
    pub is_school_staff: bool,
    pub staff_type: Option<StaffType>,
    pub employee_id: Option<String>,
    pub is_past_pupil: bool,
    pub income_level: Option<IncomeLevel>,
    pub staff_school_id: Option<Uuid>,
    pub past_pupil_school_id: Option<Uuid>,
    pub past_pupil_student_id: Option<String>,
    pub past_pupil_highest_grade: Option<String>,
    pub past_pupil_year_left: Option<i16>,
    pub past_pupil_left_reason: Option<String>,
}

#[api_operation(tag = "guardians", operation_id = "create-guardian")]
pub async fn create_guardian(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<CreateGuardianBody>,
) -> Result<CreatedJson<guardians::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationCreate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let input = body.into_inner();

    let data = guardians::Model {
        id: Uuid::new_v4(),
        relationship_type: input.relationship_type,
        full_name: input.full_name,
        nic_number: input.nic_number,
        contact_phone: input.contact_phone,
        contact_email: input.contact_email,
        occupation: input.occupation.clone(),
        workplace_name: input.workplace_name,
        workplace_address: input.workplace_address,
        is_govt_employee: input.is_govt_employee,
        govt_service_years: input.govt_service_years,
        is_school_staff: input.is_school_staff,
        is_past_pupil: input.is_past_pupil,
        past_pupil_verified: false,
        income_level: input.income_level,
        address_id: None,
        created_at: Utc::now(),
    };

    let guardian_id = data.id;
    let active: guardians::ActiveModel = data.into();
    let saved = active.insert(db.as_ref()).await?;

    if saved.is_school_staff {
        if let Some(school_id) = input.staff_school_id.or(input.past_pupil_school_id) {
            let _ = staff_details::ActiveModel {
                id: Set(Uuid::new_v4()),
                guardian_id: Set(guardian_id),
                school_id: Set(school_id),
                staff_type: Set(input.staff_type),
                employee_id: Set(input.employee_id),
                designation: Set(input.occupation.clone()),
                employment_type: Set(None),
                service_start_date: Set(None),
                service_end_date: Set(None),
                is_current: Set(true),
                verification_doc: Set(None),
                distance_from_residence_km: Set(None),
                created_at: Set(Utc::now()),
            }
            .insert(db.as_ref())
            .await;
        }
    }

    if saved.is_past_pupil {
        if let Some(school_id) = input.past_pupil_school_id {
            let _ = past_pupil_details::ActiveModel {
                id: Set(Uuid::new_v4()),
                guardian_id: Set(guardian_id),
                school_id: Set(school_id),
                student_id: Set(input.past_pupil_student_id),
                highest_grade: Set(input.past_pupil_highest_grade),
                year_left: Set(input.past_pupil_year_left),
                left_reason: Set(input.past_pupil_left_reason),
                verified: Set(false),
                verification_method: Set(None),
                created_at: Set(Utc::now()),
            }
            .insert(db.as_ref())
            .await;
        }
    }

    Ok(CreatedJson(saved))
}
