use std::marker::PhantomData;

use actix_web::{web, web::Json};
use apistos::actix::CreatedJson;
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::domain::g1_application::{Draft, G1Application, WizardStep6, WizardStep7};
use db::entity::common::enums::{AuditOperation, BatchStatus, EnrollmentStatus};
use db::entity::g1::applications;
use db::entity::g1::join_guardians;
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

    let active: applications::ActiveModel = app.model.into();
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
            if existing.wizard_step != Some(8) {
                return Err(ApiError::BadRequest(
                    "application wizard must be completed before submitting".into(),
                ));
            }
            let guardian_count = join_guardians::Entity::find()
                .filter(join_guardians::Column::ApplicationId.eq(id))
                .count(db.as_ref())
                .await?;
            if guardian_count == 0 {
                return Err(ApiError::BadRequest(
                    "at least one guardian must be added before submitting".into(),
                ));
            }
            let app = G1Application::<WizardStep7> {
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

    let final_model = submitted.model;
    let active = applications::ActiveModel {
        id: Set(final_model.id),
        reference_no: Set(final_model.reference_no),
        school_id: Set(final_model.school_id),
        total_marks: Set(final_model.total_marks),
        rank_number: Set(final_model.rank_number),
        list_category: Set(final_model.list_category),
        submitted_at: Set(final_model.submitted_at),
        verified_at: Set(final_model.verified_at),
        verified_by: Set(final_model.verified_by),
        finalized_at: Set(final_model.finalized_at),
        ip_address: Set(None),
        user_agent: Set(None),
        created_at: Set(final_model.created_at),
        updated_at: Set(Utc::now()),
        child_id: Set(final_model.child_id),
        guardian_id: Set(final_model.guardian_id),
        batch_id: Set(final_model.batch_id),
        enrollment_status: Set(final_model.enrollment_status),
        category: Set(final_model.category),
        overseas_arrival_date: Set(final_model.overseas_arrival_date),
        submission_method: Set(final_model.submission_method),
        interview_date: Set(final_model.interview_date),
        interview_completed: Set(final_model.interview_completed),
        birth_certificate_verified: Set(final_model.birth_certificate_verified),
        age_eligibility_verified: Set(final_model.age_eligibility_verified),
        residence_verified: Set(final_model.residence_verified),
        category_verified: Set(final_model.category_verified),
        alternative_age_certificate: Set(final_model.alternative_age_certificate),
        alternative_age_certificate_ref: Set(final_model.alternative_age_certificate_ref),
        rejection_reason: Set(final_model.rejection_reason),
        created_by: Set(final_model.created_by),
        updated_by: Set(final_model.updated_by),
        wizard_step: Set(final_model.wizard_step),
        deleted_at: Set(final_model.deleted_at),
        preferred_school_ids: Set(final_model.preferred_school_ids),
        electoral_year: Set(final_model.electoral_year),
        polling_district: Set(final_model.polling_district),
        polling_division: Set(final_model.polling_division),
        gn_name: Set(final_model.gn_name),
        gn_number: Set(final_model.gn_number),
        polling_area: Set(final_model.polling_area),
        village_street: Set(final_model.village_street),
        voter_names: Set(final_model.voter_names),
        household_head_name: Set(final_model.household_head_name),
        declaration_agreed: Set(final_model.declaration_agreed),
        declaration_signed_at: Set(final_model.declaration_signed_at),
        closer_school_exists: Set(final_model.closer_school_exists),
    };

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
) -> Result<db::entity::audit_logs::Model, sea_orm::DbErr> {
    let log = db::entity::audit_logs::ActiveModel {
        id: Set(Uuid::new_v4()),
        table_name: Set("g1_applications".to_string()),
        record_id: Set(record_id.unwrap_or(Uuid::nil())),
        action: Set(action),
        old_values: Set(old_values),
        new_values: Set(new_values),
        performed_by: Set(auth.user_id),
        performed_at: Set(Utc::now()),
        ip_address: Set(None),
        reason: Set(context),
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
