use actix_web::{web, web::Json};
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::entity::common::enums::StaffType;
use db::entity::common::enums::IncomeLevel;
use db::entity::common::guardians;
use db::entity::common::past_pupil_details;
use db::entity::common::staff_details;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct UpdateGuardianBody {
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
    pub address_id: Option<Uuid>,
    pub staff_school_id: Option<Uuid>,
    pub past_pupil_school_id: Option<Uuid>,
    pub past_pupil_student_id: Option<String>,
    pub past_pupil_highest_grade: Option<String>,
    pub past_pupil_year_left: Option<i16>,
    pub past_pupil_left_reason: Option<String>,
}

#[api_operation(tag = "guardians", operation_id = "update-guardian")]
pub async fn update_guardian(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: Json<UpdateGuardianBody>,
) -> Result<Json<guardians::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();
    let input = body.into_inner();

    let existing = guardians::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("guardian not found".into()))?;

    let active = guardians::ActiveModel {
        id: Set(id),
        relationship_type: Set(input.relationship_type),
        full_name: Set(input.full_name),
        nic_number: Set(input.nic_number),
        contact_phone: Set(input.contact_phone),
        contact_email: Set(input.contact_email),
        occupation: Set(input.occupation.clone()),
        workplace_name: Set(input.workplace_name),
        workplace_address: Set(input.workplace_address),
        is_govt_employee: Set(input.is_govt_employee),
        govt_service_years: Set(input.govt_service_years),
        is_school_staff: Set(input.is_school_staff),
        is_past_pupil: Set(input.is_past_pupil),
        past_pupil_verified: Set(existing.past_pupil_verified),
        income_level: Set(input.income_level),
        address_id: Set(input.address_id),
        created_at: Set(existing.created_at),
    };

    let saved = active.update(db.as_ref()).await?;

    if input.is_school_staff {
        if let Some(school_id) = input.staff_school_id.or(input.past_pupil_school_id) {
            let existing_staff = staff_details::Entity::find()
                .filter(staff_details::Column::GuardianId.eq(id))
                .one(db.as_ref())
                .await?;

            if let Some(staff) = existing_staff {
                let _ = staff_details::ActiveModel {
                    id: Set(staff.id),
                    guardian_id: Set(id),
                    school_id: Set(school_id),
                    staff_type: Set(input.staff_type),
                    employee_id: Set(input.employee_id),
                    designation: Set(input.occupation),
                    employment_type: Set(staff.employment_type),
                    service_start_date: Set(staff.service_start_date),
                    service_end_date: Set(staff.service_end_date),
                    is_current: Set(staff.is_current),
                    verification_doc: Set(staff.verification_doc),
                    distance_from_residence_km: Set(staff.distance_from_residence_km),
                    created_at: Set(staff.created_at),
                }
                .update(db.as_ref())
                .await?;
            } else {
                let _ = staff_details::ActiveModel {
                    id: Set(Uuid::new_v4()),
                    guardian_id: Set(id),
                    school_id: Set(school_id),
                    staff_type: Set(input.staff_type),
                    employee_id: Set(input.employee_id),
                    designation: Set(input.occupation),
                    employment_type: Set(None),
                    service_start_date: Set(None),
                    service_end_date: Set(None),
                    is_current: Set(true),
                    verification_doc: Set(None),
                    distance_from_residence_km: Set(None),
                    created_at: Set(Utc::now()),
                }
                .insert(db.as_ref())
                .await?;
            }
        }
    } else {
        staff_details::Entity::delete_many()
            .filter(staff_details::Column::GuardianId.eq(id))
            .exec(db.as_ref())
            .await?;
    }

    if input.is_past_pupil {
        if let Some(school_id) = input.past_pupil_school_id {
            let existing_pp = past_pupil_details::Entity::find()
                .filter(past_pupil_details::Column::GuardianId.eq(id))
                .one(db.as_ref())
                .await?;

            if let Some(pp) = existing_pp {
                let _ = past_pupil_details::ActiveModel {
                    id: Set(pp.id),
                    guardian_id: Set(id),
                    school_id: Set(school_id),
                    student_id: Set(input.past_pupil_student_id),
                    highest_grade: Set(input.past_pupil_highest_grade),
                    year_left: Set(input.past_pupil_year_left),
                    left_reason: Set(input.past_pupil_left_reason),
                    verified: Set(pp.verified),
                    verification_method: Set(pp.verification_method),
                    created_at: Set(pp.created_at),
                }
                .update(db.as_ref())
                .await?;
            } else {
                let _ = past_pupil_details::ActiveModel {
                    id: Set(Uuid::new_v4()),
                    guardian_id: Set(id),
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
                .await?;
            }
        }
    } else {
        past_pupil_details::Entity::delete_many()
            .filter(past_pupil_details::Column::GuardianId.eq(id))
            .exec(db.as_ref())
            .await?;
    }

    Ok(Json(saved))
}
