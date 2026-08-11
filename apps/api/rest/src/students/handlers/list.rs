use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::g1::children;
use db::entity::student::student;
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QuerySelect};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct ListStudentsQuery {
    pub search: Option<String>,
    pub status: Option<String>,
}

/// Response type that combines student record with child data
#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct StudentResponse {
    pub id: Uuid,
    pub child_id: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    // Child fields (personal data)
    pub full_name: String,
    pub name_with_initials: String,
    pub date_of_birth: chrono::NaiveDate,
    pub gender: db::entity::common::enums::Gender,
    pub birth_certificate_number: Option<String>,
    pub nic: Option<String>,
    pub passport_number: Option<String>,
    pub nationality: db::entity::common::enums::Nationality,
    pub religion: Option<db::entity::common::enums::Religion>,
    pub medium_of_instruction: db::entity::common::enums::MediumOfInstruction,
    pub admission_number: Option<String>,
    pub admission_date: Option<chrono::NaiveDate>,
    pub current_grade: Option<i16>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub status: db::entity::common::enums::StudentStatus,
    pub photo_url: Option<String>,
    pub disability_status: bool,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[api_operation(tag = "students", operation_id = "list-students")]
pub async fn list_students(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    query: web::Query<ListStudentsQuery>,
) -> Result<Json<Vec<StudentResponse>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    // Join students with children to get full data
    let mut q = student::Entity::find().find_with_related(children::Entity);

    if let Some(search) = &query.search {
        let pattern = format!("%{}%", search);
        q = q.filter(
            sea_orm::Condition::any()
                .add(children::Column::FullName.ilike(&pattern))
                .add(children::Column::AdmissionNumber.ilike(&pattern)),
        );
    }

    if let Some(status) = &query.status {
        let statuses: Vec<db::entity::common::enums::StudentStatus> = status
            .split(',')
            .filter_map(|s| match s.trim() {
                "Active" => Some(db::entity::common::enums::StudentStatus::Active),
                "Graduated" => Some(db::entity::common::enums::StudentStatus::Graduated),
                "Removed" => Some(db::entity::common::enums::StudentStatus::Removed),
                _ => None,
            })
            .collect();
        if !statuses.is_empty() {
            q = q.filter(children::Column::Status.is_in(statuses));
        }
    }

    let results = q.all(db.as_ref()).await?;

    let items: Vec<StudentResponse> = results
        .into_iter()
        .filter_map(|(student, children)| {
            children.into_iter().next().map(|child| StudentResponse {
                id: student.id,
                child_id: student.child_id,
                created_at: student.created_at,
                full_name: child.full_name,
                name_with_initials: child.name_with_initials,
                date_of_birth: child.date_of_birth,
                gender: child.gender,
                birth_certificate_number: child.birth_certificate_number,
                nic: child.nic,
                passport_number: child.passport_number,
                nationality: child.nationality,
                religion: child.religion,
                medium_of_instruction: child.medium_of_instruction,
                admission_number: child.admission_number,
                admission_date: child.admission_date,
                current_grade: child.current_grade,
                phone: child.phone,
                email: child.email,
                status: child.status,
                photo_url: child.photo_url,
                disability_status: child.disability_status,
                updated_at: child.updated_at,
                created_by: child.created_by,
                updated_by: child.updated_by,
            })
        })
        .collect();

    Ok(Json(items))
}
