use actix_web::{web, web::Json};
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::NaiveDate;
use db::entity::common::enums::{Gender, MediumOfInstruction, Nationality, Religion};
use db::entity::g1::children;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct UpdateChildBody {
    pub full_name: Option<String>,
    pub name_with_initials: Option<String>,
    pub date_of_birth: Option<NaiveDate>,
    pub gender: Option<Gender>,
    pub birth_certificate_number: Option<String>,
    /// National Identity Card number (for older children)
    pub nic: Option<String>,
    /// Passport number (for overseas arrivals)
    pub passport_number: Option<String>,
    pub nationality: Option<Nationality>,
    pub religion: Option<Religion>,
    pub medium_of_instruction: Option<MediumOfInstruction>,
    pub disability_status: Option<bool>,
    pub disability_type: Option<String>,
    pub photo_url: Option<String>,
}

#[api_operation(tag = "children", operation_id = "update-child")]
pub async fn update_child(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: Json<UpdateChildBody>,
) -> Result<Json<children::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();

    let existing = children::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("child not found".into()))?;

    let mut m = body.into_inner();

    if let Some(name) = m.full_name {
        m.full_name =
            Some(crate::validation::NonEmpty::new(name, "full_name")?.into_inner());
    }
    if let Some(name) = m.name_with_initials {
        m.name_with_initials =
            Some(crate::validation::NameWithInitials::new(name)?.into_inner());
    }
    m.birth_certificate_number = m.birth_certificate_number
        .map(|e| crate::validation::NonEmpty::new(e, "birth_certificate_number").map(|v| v.into_inner()))
        .transpose()?;

    let active = children::ActiveModel {
        id: Set(id),
        student_id: Set(existing.student_id),
        full_name: Set(m.full_name.unwrap_or(existing.full_name)),
        name_with_initials: Set(m.name_with_initials.unwrap_or(existing.name_with_initials)),
        date_of_birth: Set(m.date_of_birth.unwrap_or(existing.date_of_birth)),
        gender: Set(m.gender.unwrap_or(existing.gender)),
        birth_certificate_number: Set(
            m.birth_certificate_number.or(existing.birth_certificate_number),
        ),
        nic: Set(m.nic.or(existing.nic)),
        passport_number: Set(m.passport_number.or(existing.passport_number)),
        nationality: Set(m.nationality.unwrap_or(existing.nationality)),
        religion: Set(m.religion.or(existing.religion)),
        medium_of_instruction: Set(
            m.medium_of_instruction.unwrap_or(existing.medium_of_instruction),
        ),
        disability_status: Set(m.disability_status.unwrap_or(existing.disability_status)),
        disability_type: Set(m.disability_type.or(existing.disability_type)),
        photo_url: Set(m.photo_url.or(existing.photo_url)),
        created_at: Set(existing.created_at),
    };

    let saved = active.update(db.as_ref()).await?;
    Ok(Json(saved))
}
