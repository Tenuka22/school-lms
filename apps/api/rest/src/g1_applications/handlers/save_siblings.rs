use actix_web::web;
use apistos::ApiComponent;
use apistos::api_operation;
use chrono::Utc;
use db::entity::common::enums::AuditOperation;
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
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let app_id = id.into_inner();
    let user_id = auth.user_id;
    let student_ids = &body.student_ids;

    info!("[save_siblings] user={user_id:?} app={app_id} student_ids={student_ids:?}");

    let app = applications::Entity::find_by_id(app_id)
        .filter(applications::Column::DeletedAt.is_null())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| {
            warn!("[save_siblings] application {app_id} not found");
            ApiError::not_found("Application not found")
        })?;

    let school_id = app
        .school_id
        .ok_or_else(|| ApiError::bad_request("Application has no school assigned"))?;

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

    info!(
        "[save_siblings] found {} students out of {} requested",
        students.len(),
        student_ids.len()
    );

    let mut count = 0;
    for s in &students {
        // Find existing sibling record for this student + school, or create one
        let existing = siblings::Entity::find()
            .filter(siblings::Column::StudentId.eq(s.id))
            .filter(siblings::Column::SchoolId.eq(school_id))
            .one(db.as_ref())
            .await?;

        let sibling_id = if let Some(existing_sibling) = existing {
            info!(
                "[save_siblings] reusing existing sibling_id={} for student_id={}",
                existing_sibling.id, s.id
            );
            existing_sibling.id
        } else {
            // Need to get child name from child record
            let child = db::entity::g1::children::Entity::find_by_id(s.child_id)
                .one(db.as_ref())
                .await?;
            let child_name = child
                .as_ref()
                .map(|c| c.full_name.clone())
                .unwrap_or_default();
            let child_grade = child.as_ref().and_then(|c| c.current_grade);

            let new_sibling = siblings::ActiveModel {
                id: Set(Uuid::new_v4()),
                student_id: Set(s.id),
                school_id: Set(school_id),
                sibling_name: Set(child_name),
                current_grade: Set(child_grade),
                admission_year: Set(None),
                verified: Set(false),
                verification_doc: Set(None),
                created_at: Set(Utc::now()),
            }
            .insert(db.as_ref())
            .await?;
            info!(
                "[save_siblings] created new sibling_id={} for student_id={}",
                new_sibling.id, s.id
            );
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

    crate::audit::log_application_change(
        db.as_ref(),
        app_id,
        AuditOperation::Update,
        None,
        Some(serde_json::json!({"sibling_student_ids": student_ids, "count": count})),
        &auth,
        Some(format!("siblings saved: {} linked", count)),
    )
    .await;

    Ok(web::Json(SaveSiblingsResponse { count }))
}
