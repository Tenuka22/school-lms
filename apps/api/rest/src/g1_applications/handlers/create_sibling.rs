use actix_web::web;
use apistos::ApiComponent;
use apistos::api_operation;
use chrono::{NaiveDate, Utc};
use db::entity::common::enums::{
    AuditOperation, Gender, MediumOfInstruction, Nationality, Religion, StudentStatus,
};
use db::entity::common::siblings;
use db::entity::g1::{applications, children, join_siblings};
use db::entity::student::student;
use log::info;
use schemars::JsonSchema;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter, Set,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Deserialize, JsonSchema, ApiComponent)]
pub struct CreateSiblingRequest {
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
    pub school_id: Option<Uuid>,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct SiblingDuplicate {
    pub id: Uuid,
    pub full_name: String,
    pub name_with_initials: String,
    pub date_of_birth: NaiveDate,
    pub gender: Gender,
    pub nationality: Nationality,
    pub medium_of_instruction: MediumOfInstruction,
    pub birth_certificate_number: Option<String>,
    pub nic: Option<String>,
    pub current_grade: Option<i16>,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct CreateSiblingResponse {
    pub student_id: Option<Uuid>,
    pub created: bool,
    pub duplicates: Vec<SiblingDuplicate>,
}

#[api_operation(tag = "g1-applications", operation_id = "create-sibling")]
pub async fn create_sibling(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: web::Json<CreateSiblingRequest>,
) -> Result<web::Json<CreateSiblingResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let app_id = id.into_inner();
    let user_id = auth.user_id;
    let mut body = body.into_inner();

    body.full_name = crate::validation::FullName::new(body.full_name)?.into_inner();
    body.name_with_initials =
        crate::validation::NameWithInitials::new(body.name_with_initials)?.into_inner();
    body.email = body
        .email
        .map(|e| crate::validation::Email::new(e).map(|v| v.into_inner()))
        .transpose()?;
    body.phone = body
        .phone
        .map(|p| crate::validation::Phone::new(p).map(|v| v.into_inner()))
        .transpose()?;
    body.birth_certificate_number = body
        .birth_certificate_number
        .map(|e| {
            crate::validation::NonEmpty::new(e, "birth_certificate_number").map(|v| v.into_inner())
        })
        .transpose()?;
    body.nic = body
        .nic
        .map(|e| crate::validation::NicNumber::new(e).map(|v| v.into_inner()))
        .transpose()?;

    info!(
        "[create_sibling] user={user_id:?} app={app_id} name={}",
        body.full_name
    );

    let app = applications::Entity::find_by_id(app_id)
        .filter(applications::Column::DeletedAt.is_null())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::not_found("Application not found"))?;

    let school_id = body.school_id.or(app.school_id).ok_or_else(|| {
        ApiError::bad_request("Application has no school assigned and no school_id provided")
    })?;

    let now = Utc::now();

    // Search for potential duplicate children by name, birth cert, or NIC
    let mut dup_conditions = Condition::any()
        .add(children::Column::FullName.ilike(format!("%{}%", &body.full_name)))
        .add(children::Column::NameWithInitials.ilike(format!("%{}%", &body.name_with_initials)));

    if let Some(ref bc) = body.birth_certificate_number {
        dup_conditions =
            dup_conditions.add(children::Column::BirthCertificateNumber.eq(bc.as_str()));
    }
    if let Some(ref nic) = body.nic {
        dup_conditions = dup_conditions.add(children::Column::Nic.eq(nic.as_str()));
    }

    let duplicates = children::Entity::find()
        .filter(dup_conditions)
        .all(db.as_ref())
        .await?
        .into_iter()
        .map(|c| SiblingDuplicate {
            id: c.id,
            full_name: c.full_name,
            name_with_initials: c.name_with_initials,
            date_of_birth: c.date_of_birth,
            gender: c.gender,
            nationality: c.nationality,
            medium_of_instruction: c.medium_of_instruction,
            birth_certificate_number: c.birth_certificate_number,
            nic: c.nic,
            current_grade: c.current_grade,
        })
        .collect::<Vec<_>>();

    // If duplicates exist, return them without creating
    if !duplicates.is_empty() {
        info!(
            "[create_sibling] found {} potential duplicates, returning without creating",
            duplicates.len()
        );
        return Ok(web::Json(CreateSiblingResponse {
            student_id: None,
            created: false,
            duplicates,
        }));
    }

    // Step 1: Create child record
    let new_child = children::ActiveModel {
        id: Set(Uuid::new_v4()),
        student_id: Set(None), // Will be set after student is created
        full_name: Set(body.full_name.clone()),
        name_with_initials: Set(body.name_with_initials.clone()),
        date_of_birth: Set(body.date_of_birth),
        gender: Set(body.gender),
        birth_certificate_number: Set(body.birth_certificate_number.clone()),
        nic: Set(body.nic.clone()),
        passport_number: Set(body.passport_number.clone()),
        name_with_initials_en: Set(None),
        nationality: Set(body.nationality),
        religion: Set(body.religion),
        medium_of_instruction: Set(body.medium_of_instruction),
        disability_status: Set(false),
        disability_type: Set(None),
        photo_url: Set(None),
        admission_number: Set(body.birth_certificate_number.clone()),
        admission_date: Set(None),
        current_grade: Set(body.current_grade),
        phone: Set(body.phone.clone()),
        email: Set(body.email.clone()),
        status: Set(StudentStatus::Active),
        created_at: Set(now),
        updated_at: Set(now),
        created_by: Set(user_id),
        updated_by: Set(user_id),
    }
    .insert(db.as_ref())
    .await?;

    info!("[create_sibling] created child_id={}", new_child.id);

    crate::audit::log_child_change(
        db.as_ref(),
        new_child.id,
        AuditOperation::Insert,
        None,
        crate::audit::to_json(&new_child),
        &auth,
        Some(format!("sibling created for application {}", app_id)),
    )
    .await;

    // Step 2: Create student record linked to child
    let new_student = student::ActiveModel {
        id: Set(Uuid::new_v4()),
        child_id: Set(new_child.id),
        created_at: Set(now),
    }
    .insert(db.as_ref())
    .await?;

    info!("[create_sibling] created student_id={}", new_student.id);

    crate::audit::log_student_change(
        db.as_ref(),
        new_student.id,
        AuditOperation::Insert,
        None,
        crate::audit::to_json(&new_student),
        &auth,
        Some(format!(
            "sibling student created for application {}",
            app_id
        )),
    )
    .await;

    // Step 3: Update child record with student_id
    let mut child_update = children::ActiveModel::from(new_child.clone());
    child_update.student_id = Set(Some(new_student.id));
    child_update.update(db.as_ref()).await?;

    // Step 4: Create sibling record
    let new_sibling = siblings::ActiveModel {
        id: Set(Uuid::new_v4()),
        student_id: Set(new_student.id),
        school_id: Set(school_id),
        sibling_name: Set(body.full_name.clone()),
        current_grade: Set(body.current_grade),
        admission_year: Set(None),
        verified: Set(false),
        verification_doc: Set(None),
        created_at: Set(now),
    }
    .insert(db.as_ref())
    .await?;

    info!("[create_sibling] created sibling_id={}", new_sibling.id);

    // Step 5: Create join record
    join_siblings::ActiveModel {
        id: Set(Uuid::new_v4()),
        application_id: Set(app_id),
        sibling_id: Set(new_sibling.id),
        created_at: Set(now),
    }
    .insert(db.as_ref())
    .await?;

    info!("[create_sibling] created join for app {app_id}");

    Ok(web::Json(CreateSiblingResponse {
        student_id: Some(new_student.id),
        created: true,
        duplicates: vec![],
    }))
}
