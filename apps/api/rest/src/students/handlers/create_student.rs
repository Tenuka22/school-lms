use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use chrono::{NaiveDate, Utc};
use db::entity::common::enums::{
    AuditOperation, Gender, MediumOfInstruction, Nationality, Religion, StudentStatus,
};
use db::entity::g1::children;
use db::entity::student::student;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct CreateStudentBody {
    /// If provided, link to existing child. Otherwise create new child from the fields below.
    pub child_id: Option<Uuid>,
    // Child fields (used when child_id is None)
    pub full_name: Option<String>,
    pub name_with_initials: Option<String>,
    pub date_of_birth: Option<NaiveDate>,
    pub gender: Option<Gender>,
    pub birth_certificate_number: Option<String>,
    pub nic: Option<String>,
    pub passport_number: Option<String>,
    pub nationality: Option<Nationality>,
    pub religion: Option<Religion>,
    pub medium_of_instruction: Option<MediumOfInstruction>,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct DuplicateChild {
    pub id: Uuid,
    pub full_name: String,
    pub name_with_initials: String,
    pub date_of_birth: NaiveDate,
    pub gender: Gender,
    pub birth_certificate_number: Option<String>,
    pub nic: Option<String>,
    pub nationality: Nationality,
    pub medium_of_instruction: MediumOfInstruction,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct CreateStudentResponse {
    pub student_id: Uuid,
    pub child_id: Uuid,
    /// If duplicates were found and user chose to use existing child
    pub used_existing_child: bool,
}

#[api_operation(tag = "students", operation_id = "create-student")]
pub async fn create_student(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<CreateStudentBody>,
) -> Result<Json<CreateStudentResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationCreate)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let user_id = auth.user_id;
    let now = Utc::now();
    let body = body.into_inner();

    // If child_id is provided, use existing child
    if let Some(child_id) = body.child_id {
        let child = children::Entity::find_by_id(child_id)
            .one(db.as_ref())
            .await?
            .ok_or_else(|| ApiError::not_found("Child not found"))?;

        // Check if child already has a student
        let existing_student = student::Entity::find()
            .filter(student::Column::ChildId.eq(child_id))
            .one(db.as_ref())
            .await?;
        if existing_student.is_some() {
            return Err(ApiError::conflict(format!(
                "Child '{}' already has a student record",
                child.full_name
            )));
        }

        let new_student = student::ActiveModel {
            id: Set(Uuid::new_v4()),
            child_id: Set(child_id),
            created_at: Set(now),
        }
        .insert(db.as_ref())
        .await?;

        crate::audit::log_student_change(
            db.as_ref(),
            new_student.id,
            AuditOperation::Insert,
            None,
            Some(serde_json::json!({
                "child_id": child_id,
                "child_name": child.full_name,
                "used_existing_child": true,
            })),
            &auth,
            Some(format!("student created from existing child {}", child_id)),
        )
        .await;

        return Ok(Json(CreateStudentResponse {
            student_id: new_student.id,
            child_id,
            used_existing_child: true,
        }));
    }

    // No child_id provided — validate required fields
    let full_name = body.full_name.ok_or_else(|| {
        ApiError::bad_request("full_name is required when child_id is not provided")
    })?;
    let name_with_initials = body
        .name_with_initials
        .ok_or_else(|| ApiError::bad_request("name_with_initials is required"))?;
    let date_of_birth = body
        .date_of_birth
        .ok_or_else(|| ApiError::bad_request("date_of_birth is required"))?;
    let gender = body
        .gender
        .ok_or_else(|| ApiError::bad_request("gender is required"))?;
    let nationality = body
        .nationality
        .ok_or_else(|| ApiError::bad_request("nationality is required"))?;
    let medium_of_instruction = body
        .medium_of_instruction
        .ok_or_else(|| ApiError::bad_request("medium_of_instruction is required"))?;

    // Search for duplicate children by BC number or NIC
    let mut dup_conditions = sea_orm::Condition::any();

    if let Some(ref bc) = body.birth_certificate_number {
        if !bc.is_empty() {
            dup_conditions =
                dup_conditions.add(children::Column::BirthCertificateNumber.eq(bc.as_str()));
        }
    }
    if let Some(ref nic) = body.nic {
        if !nic.is_empty() {
            dup_conditions = dup_conditions.add(children::Column::Nic.eq(nic.as_str()));
        }
    }

    // Only search if we have something to match on
    let has_search = body
        .birth_certificate_number
        .as_ref()
        .map_or(false, |s| !s.is_empty())
        || body.nic.as_ref().map_or(false, |s| !s.is_empty());

    if has_search {
        let duplicates = children::Entity::find()
            .filter(dup_conditions)
            .all(db.as_ref())
            .await?;

        if !duplicates.is_empty() {
            let dup_list: Vec<DuplicateChild> = duplicates
                .into_iter()
                .map(|c| DuplicateChild {
                    id: c.id,
                    full_name: c.full_name,
                    name_with_initials: c.name_with_initials,
                    date_of_birth: c.date_of_birth,
                    gender: c.gender,
                    birth_certificate_number: c.birth_certificate_number,
                    nic: c.nic,
                    nationality: c.nationality,
                    medium_of_instruction: c.medium_of_instruction,
                })
                .collect();

            return Err(ApiError::ConflictWithDuplicates(dup_list));
        }
    }

    // No duplicates — create child then student
    let new_child = children::ActiveModel {
        id: Set(Uuid::new_v4()),
        student_id: Set(None),
        full_name: Set(full_name),
        name_with_initials: Set(name_with_initials),
        date_of_birth: Set(date_of_birth),
        gender: Set(gender),
        birth_certificate_number: Set(body.birth_certificate_number),
        nic: Set(body.nic),
        passport_number: Set(body.passport_number),
        name_with_initials_en: Set(None),
        nationality: Set(nationality),
        religion: Set(body.religion),
        medium_of_instruction: Set(medium_of_instruction),
        disability_status: Set(false),
        disability_type: Set(None),
        photo_url: Set(None),
        admission_number: Set(None),
        admission_date: Set(None),
        current_grade: Set(None),
        phone: Set(None),
        email: Set(None),
        status: Set(StudentStatus::Active),
        created_at: Set(now),
        updated_at: Set(now),
        created_by: Set(user_id),
        updated_by: Set(user_id),
    }
    .insert(db.as_ref())
    .await?;

    crate::audit::log_child_change(
        db.as_ref(),
        new_child.id,
        AuditOperation::Insert,
        None,
        crate::audit::to_json(&new_child),
        &auth,
        Some("child created for student".into()),
    )
    .await;

    let new_student = student::ActiveModel {
        id: Set(Uuid::new_v4()),
        child_id: Set(new_child.id),
        created_at: Set(now),
    }
    .insert(db.as_ref())
    .await?;

    // Link child to student
    let mut child_update = children::ActiveModel::from(new_child.clone());
    child_update.student_id = Set(Some(new_student.id));
    child_update.update(db.as_ref()).await?;

    crate::audit::log_student_change(
        db.as_ref(),
        new_student.id,
        AuditOperation::Insert,
        None,
        Some(serde_json::json!({
            "child_id": new_child.id,
            "child_name": new_child.full_name,
            "used_existing_child": false,
        })),
        &auth,
        Some(format!("student created with new child {}", new_child.id)),
    )
    .await;

    Ok(Json(CreateStudentResponse {
        student_id: new_student.id,
        child_id: new_child.id,
        used_existing_child: false,
    }))
}
