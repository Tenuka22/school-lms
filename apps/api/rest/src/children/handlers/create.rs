use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::actix::CreatedJson;
use apistos::api_operation;
use chrono::{NaiveDate, Utc};
use db::entity::common::enums::{
    Gender, MediumOfInstruction, Nationality, Religion, StudentStatus,
};
use db::entity::g1::children;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::entity::common::enums::AuditOperation;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct CreateChildBody {
    pub full_name: String,
    pub name_with_initials: String,
    pub date_of_birth: NaiveDate,
    pub gender: Gender,
    pub birth_certificate_number: Option<String>,
    /// National Identity Card number (for older children)
    pub nic: Option<String>,
    /// Passport number (for overseas arrivals)
    pub passport_number: Option<String>,
    pub nationality: Nationality,
    pub religion: Option<Religion>,
    pub medium_of_instruction: MediumOfInstruction,
    pub disability_status: Option<bool>,
    pub disability_type: Option<String>,
    pub photo_url: Option<String>,
}

#[api_operation(tag = "children", operation_id = "create-child")]
pub async fn create_child(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<CreateChildBody>,
) -> Result<CreatedJson<children::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationCreate)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let mut data = body.into_inner();
    let user_id = auth.user_id;
    let now = Utc::now();

    data.full_name = crate::validation::NonEmpty::new(data.full_name, "full_name")?.into_inner();
    data.name_with_initials =
        crate::validation::NameWithInitials::new(data.name_with_initials)?.into_inner();
    data.birth_certificate_number = data
        .birth_certificate_number
        .map(|e| {
            crate::validation::NonEmpty::new(e, "birth_certificate_number").map(|v| v.into_inner())
        })
        .transpose()?;

    if let Some(ref bc) = data.birth_certificate_number {
        let existing = children::Entity::find()
            .filter(children::Column::BirthCertificateNumber.eq(bc.as_str()))
            .one(db.as_ref())
            .await?;
        if existing.is_some() {
            return Err(ApiError::conflict(format!(
                "A child with birth certificate number '{}' already exists",
                bc
            )));
        }
    }

    if let Some(ref nic) = data.nic {
        let existing = children::Entity::find()
            .filter(children::Column::Nic.eq(nic.as_str()))
            .one(db.as_ref())
            .await?;
        if existing.is_some() {
            return Err(ApiError::conflict(format!(
                "A child with NIC '{}' already exists",
                nic
            )));
        }
    }

    let active = children::ActiveModel {
        id: Set(Uuid::new_v4()),
        student_id: Set(None),
        full_name: Set(data.full_name),
        name_with_initials: Set(data.name_with_initials),
        date_of_birth: Set(data.date_of_birth),
        gender: Set(data.gender),
        birth_certificate_number: Set(data.birth_certificate_number),
        nic: Set(data.nic),
        passport_number: Set(data.passport_number),
        name_with_initials_en: Set(None),
        nationality: Set(data.nationality),
        religion: Set(data.religion),
        medium_of_instruction: Set(data.medium_of_instruction),
        disability_status: Set(data.disability_status.unwrap_or(false)),
        disability_type: Set(data.disability_type),
        photo_url: Set(data.photo_url),
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
    };

    let saved = active.insert(db.as_ref()).await?;

    crate::audit::log_child_change(
        db.as_ref(),
        saved.id,
        AuditOperation::Insert,
        None,
        crate::audit::to_json(&saved),
        &auth,
        Some("child created".into()),
    )
    .await;

    Ok(CreatedJson(saved))
}
