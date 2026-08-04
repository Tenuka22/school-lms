use std::marker::PhantomData;

use actix_web::{web, web::Json};
use apistos::actix::CreatedJson;
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::domain::g1_application::{Draft, G1Application, WizardStep6};
use db::entity::common::enums::{AuditOperation, BatchStatus, EnrollmentStatus};
use db::entity::g1::applications;
use db::entity::enrollment_batches;
use schemars::JsonSchema;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter,
    Set, TransactionTrait,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct CreateApplicationBody {
    pub batch_id: Uuid,
    pub school_id: Option<Uuid>,
    pub child_id: Option<Uuid>,
    pub preferred_school_ids: Option<Vec<Uuid>>,
}

#[api_operation(tag = "g1-applications", operation_id = "create-application")]
pub async fn create_application(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<CreateApplicationBody>,
) -> Result<CreatedJson<applications::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationCreate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let data = body.into_inner();

    let batch = enrollment_batches::Entity::find_by_id(data.batch_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::BadRequest("batch not found".into()))?;

    if batch.status != BatchStatus::Open {
        return Err(ApiError::BadRequest(
            "batch is not open for applications".into(),
        ));
    }

    let now = Utc::now();
    if batch.closed_at <= now {
        return Err(ApiError::BadRequest(
            "application window has closed for this batch".into(),
        ));
    }

    let count = applications::Entity::find()
        .filter(applications::Column::BatchId.eq(batch.id))
        .filter(applications::Column::DeletedAt.is_null())
        .count(db.as_ref())
        .await?;

    let reference_no = format!("{}-{:04}", batch.batch_code, count + 1);
    let mut app = G1Application::<Draft>::new(data.batch_id, reference_no);
    app.model.school_id = data.school_id;
    app.model.child_id = data.child_id.unwrap_or(Uuid::nil());
    app.model.preferred_school_ids = data
        .preferred_school_ids
        .map(|ids| serde_json::to_value(ids).ok())
        .flatten();

    let active = applications::ActiveModel {
        id: Set(app.model.id),
        reference_no: Set(app.model.reference_no),
        school_id: Set(app.model.school_id),
        batch_id: Set(app.model.batch_id),
        enrollment_status: Set(app.model.enrollment_status),
        created_at: Set(app.model.created_at),
        updated_at: Set(app.model.updated_at),
        created_by: Set(None),
        updated_by: Set(None),
        child_id: Set(app.model.child_id),
        guardian_id: Set(app.model.guardian_id),
        wizard_step: Set(app.model.wizard_step),
        total_marks: Set(None),
        rank_number: Set(None),
        list_category: Set(None),
        waiting_position: Set(None),
        promoted_at: Set(None),
        submitted_at: Set(None),
        verified_at: Set(None),
        verified_by: Set(None),
        finalized_at: Set(None),
        ip_address: Set(None),
        user_agent: Set(None),
        category: Set(None),
        overseas_arrival_date: Set(None),
        submission_method: Set(None),
        interview_date: Set(None),
        interview_completed: Set(false),
        birth_certificate_verified: Set(false),
        age_eligibility_verified: Set(false),
        residence_verified: Set(false),
        category_verified: Set(false),
        alternative_age_certificate: Set(false),
        alternative_age_certificate_ref: Set(None),
        rejection_reason: Set(None),
        deleted_at: Set(None),
        preferred_school_ids: Set(app.model.preferred_school_ids),
        electoral_year: Set(None),
        polling_district: Set(None),
        gn_division: Set(None),
        polling_area: Set(None),
        voter_names: Set(None),
        household_head_name: Set(None),
        declaration_agreed: Set(false),
        declaration_signed_at: Set(None),
    };

    let saved = active.insert(db.as_ref()).await?;

    let _ = create_audit_log(
        db.as_ref(),
        Some(saved.id),
        AuditOperation::Insert,
        None,
        serde_json::to_value(&saved).ok(),
        None,
        auth,
    )
    .await;

    Ok(CreatedJson(saved))
}

#[api_operation(tag = "g1-applications", operation_id = "submit-application")]
pub async fn submit_application(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<applications::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationSubmit)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();

    let existing = applications::Entity::find_by_id(id)
        .filter(applications::Column::DeletedAt.is_null())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("application not found".into()))?;

    let batch = enrollment_batches::Entity::find_by_id(existing.batch_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::BadRequest("enrollment batch not found".into()))?;

    let now = Utc::now();
    if batch.status != BatchStatus::Open || batch.closed_at <= now {
        return Err(ApiError::BadRequest(
            "cannot submit application after enrollment batch closed".into(),
        ));
    }

    let txn = db.begin().await?;

    let submitted = match existing.enrollment_status {
        EnrollmentStatus::Draft | EnrollmentStatus::Pending => {
            if existing.wizard_step != Some(6) {
                return Err(ApiError::BadRequest(
                    "application wizard must be completed before submitting".into(),
                ));
            }
            let app = G1Application::<WizardStep6> {
                model: existing.clone(),
                _state: PhantomData,
            };
            app.submit()?
        }
        _ => {
            return Err(ApiError::BadRequest(
                "only draft or pending applications can be submitted".into(),
            ));
        }
    };

    let mut active: applications::ActiveModel = submitted.model.into();
    active.ip_address = Set(None);
    active.user_agent = Set(None);
    active.updated_at = Set(Utc::now());

    let saved = active.update(&txn).await?;

    let _ = create_audit_log(
        db.as_ref(),
        Some(id),
        AuditOperation::Update,
        old_json_for_status(&existing),
        new_json_for_status(&saved),
        None,
        auth,
    )
    .await;

    txn.commit().await?;

    Ok(Json(saved))
}

async fn create_audit_log(
    db: &DatabaseConnection,
    record_id: Option<Uuid>,
    action: AuditOperation,
    old_values: Option<serde_json::Value>,
    new_values: Option<serde_json::Value>,
    context: Option<String>,
    auth: AuthenticatedUser,
) -> Result<db::entity::g1::audit::Model, sea_orm::DbErr> {
    let log = db::entity::g1::audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        application_id: Set(record_id),
        operation: Set(action),
        changed_fields: Set(None),
        old_values: Set(old_values),
        new_values: Set(new_values),
        changed_by: Set(auth.user_id),
        changed_at: Set(Utc::now()),
        context: Set(context),
    };
    log.insert(db).await
}

fn old_json_for_status(existing: &applications::Model) -> Option<serde_json::Value> {
    let mut map = serde_json::Map::new();
    map.insert(
        "enrollment_status".into(),
        serde_json::json!(existing.enrollment_status),
    );
    Some(serde_json::Value::Object(map))
}

fn new_json_for_status(saved: &applications::Model) -> Option<serde_json::Value> {
    let mut map = serde_json::Map::new();
    map.insert(
        "enrollment_status".into(),
        serde_json::json!(saved.enrollment_status),
    );
    Some(serde_json::Value::Object(map))
}
