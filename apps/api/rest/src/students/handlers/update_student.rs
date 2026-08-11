use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use chrono::{NaiveDate, Utc};
use db::entity::common::enums::{
    AuditOperation, Gender, MediumOfInstruction, Nationality, Religion,
};
use db::entity::g1::children;
use db::entity::student::student;
use log::info;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Deserialize, JsonSchema, ApiComponent)]
pub struct UpdateStudentRequest {
    pub full_name: String,
    pub name_with_initials: String,
    pub date_of_birth: NaiveDate,
    pub gender: Gender,
    pub nationality: Nationality,
    pub religion: Option<Religion>,
    pub medium_of_instruction: MediumOfInstruction,
    pub birth_certificate_number: Option<String>,
    pub nic: Option<String>,
    pub passport_number: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub current_grade: Option<i16>,
}

#[api_operation(tag = "students", operation_id = "update-student")]
pub async fn update_student(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: web::Json<UpdateStudentRequest>,
) -> Result<Json<children::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let student_id = id.into_inner();
    let user_id = auth.user_id;
    let mut b = body.into_inner();

    b.full_name = crate::validation::FullName::new(b.full_name)?.into_inner();
    b.name_with_initials =
        crate::validation::NameWithInitials::new(b.name_with_initials)?.into_inner();
    b.email = b
        .email
        .map(|e| crate::validation::Email::new(e).map(|v| v.into_inner()))
        .transpose()?;
    b.phone = b
        .phone
        .map(|p| crate::validation::Phone::new(p).map(|v| v.into_inner()))
        .transpose()?;
    b.birth_certificate_number = b
        .birth_certificate_number
        .map(|e| {
            crate::validation::NonEmpty::new(e, "birth_certificate_number").map(|v| v.into_inner())
        })
        .transpose()?;
    b.nic = b
        .nic
        .map(|e| crate::validation::NicNumber::new(e).map(|v| v.into_inner()))
        .transpose()?;

    info!(
        "[update_student] user={user_id:?} student={student_id} name={}",
        b.full_name
    );

    // Find the student record to get the child_id
    let existing = student::Entity::find_by_id(student_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::not_found("Student not found"))?;

    // Find and update the child record
    let child = children::Entity::find_by_id(existing.child_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::not_found("Child record not found"))?;

    let old_json = crate::audit::to_json(&child);

    let child_active = children::ActiveModel {
        id: Set(child.id),
        student_id: Set(child.student_id),
        full_name: Set(b.full_name),
        name_with_initials: Set(b.name_with_initials),
        date_of_birth: Set(b.date_of_birth),
        gender: Set(b.gender),
        birth_certificate_number: Set(b.birth_certificate_number),
        nic: Set(b.nic),
        passport_number: Set(b.passport_number),
        name_with_initials_en: Set(child.name_with_initials_en),
        nationality: Set(b.nationality),
        religion: Set(b.religion),
        medium_of_instruction: Set(b.medium_of_instruction),
        disability_status: Set(child.disability_status),
        disability_type: Set(child.disability_type),
        photo_url: Set(child.photo_url),
        admission_number: Set(child.admission_number),
        admission_date: Set(child.admission_date),
        current_grade: Set(b.current_grade),
        phone: Set(b.phone),
        email: Set(b.email),
        status: Set(child.status),
        created_at: Set(child.created_at),
        updated_at: Set(Utc::now()),
        created_by: Set(child.created_by),
        updated_by: Set(user_id),
    };

    let saved = child_active.update(db.as_ref()).await?;

    crate::audit::log_child_change(
        db.as_ref(),
        saved.id,
        AuditOperation::Update,
        old_json,
        crate::audit::to_json(&saved),
        &auth,
        Some(format!("student {} updated", student_id)),
    )
    .await;

    info!("[update_student] updated child_id={}", saved.id);

    Ok(Json(saved))
}
