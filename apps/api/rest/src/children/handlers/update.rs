use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::g1::children;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[api_operation(tag = "children", operation_id = "update-child")]
pub async fn update_child(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: Json<children::Model>,
) -> Result<Json<children::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();

    let existing = children::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("child not found".into()))?;

    let m = body.into_inner();

    let active = children::ActiveModel {
        id: Set(id),
        student_id: Set(m.student_id),
        full_name: Set(m.full_name),
        name_with_initials: Set(m.name_with_initials),
        date_of_birth: Set(m.date_of_birth),
        gender: Set(m.gender),
        birth_certificate_number: Set(m.birth_certificate_number),
        nationality: Set(m.nationality),
        religion: Set(m.religion),
        medium_of_instruction: Set(m.medium_of_instruction),
        disability_status: Set(m.disability_status),
        disability_type: Set(m.disability_type),
        photo_url: Set(m.photo_url),
        created_at: Set(existing.created_at),
    };

    let saved = active.update(db.as_ref()).await?;
    Ok(Json(saved))
}
