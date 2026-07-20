use actix_web::web;
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::entity::common::siblings;
use db::entity::g1::{applications, join_siblings};
use db::entity::student::student;
use log::{info, warn};
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Deserialize, JsonSchema, ApiComponent)]
pub struct SaveSiblingsRequest {
    pub student_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct SaveSiblingsResponse {
    pub count: usize,
}

#[api_operation(tag = "g1-applications", operation_id = "save-siblings")]
pub async fn save_siblings(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: web::Json<SaveSiblingsRequest>,
) -> Result<web::Json<SaveSiblingsResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let app_id = id.into_inner();
    let user_id = auth.user_id;
    let student_ids = &body.student_ids;

    info!("[save_siblings] user={user_id:?} app={app_id} student_ids={student_ids:?}");

    let app = applications::Entity::find_by_id(app_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| {
            warn!("[save_siblings] application {app_id} not found");
            ApiError::NotFound("Application not found".into())
        })?;

    let school_id = app.school_id
        .ok_or_else(|| ApiError::BadRequest("Application has no school assigned".into()))?;

    // Delete existing joins
    let deleted = join_siblings::Entity::delete_many()
        .filter(join_siblings::Column::ApplicationId.eq(app_id))
        .exec(db.as_ref())
        .await?;

    info!("[save_siblings] deleted {deleted:?} existing join rows for app {app_id}");

    // Look up students
    let students = student::Entity::find()
        .filter(student::Column::Id.is_in(student_ids.clone()))
        .all(db.as_ref())
        .await?;

    info!("[save_siblings] found {} students out of {} requested", students.len(), student_ids.len());

    let mut count = 0;
    for s in &students {
        // Find existing sibling record for this student + school, or create one
        let existing = siblings::Entity::find()
            .filter(siblings::Column::StudentId.eq(s.id))
            .filter(siblings::Column::SchoolId.eq(school_id))
            .one(db.as_ref())
            .await?;

        let sibling_id = if let Some(existing_sibling) = existing {
            info!("[save_siblings] reusing existing sibling_id={} for student_id={}", existing_sibling.id, s.id);
            existing_sibling.id
        } else {
            let new_sibling = siblings::ActiveModel {
                id: Set(Uuid::new_v4()),
                student_id: Set(s.id),
                school_id: Set(school_id),
                sibling_name: Set(s.full_name.clone()),
                current_grade: Set(s.current_grade),
                admission_year: Set(None),
                verified: Set(false),
                verification_doc: Set(None),
                created_at: Set(Utc::now()),
            }
            .insert(db.as_ref())
            .await?;
            info!("[save_siblings] created new sibling_id={} for student_id={}", new_sibling.id, s.id);
            new_sibling.id
        };

        join_siblings::ActiveModel {
            id: Set(Uuid::new_v4()),
            application_id: Set(app_id),
            sibling_id: Set(sibling_id),
            created_at: Set(Utc::now()),
        }
        .insert(db.as_ref())
        .await?;
        count += 1;
    }

    info!("[save_siblings] success count={}", count);

    Ok(web::Json(SaveSiblingsResponse { count }))
}
