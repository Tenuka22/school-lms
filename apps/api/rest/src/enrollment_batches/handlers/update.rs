use std::marker::PhantomData;

use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::domain::batch::{AppealsPeriod, Batch, Closed, ListsPublished, Open};
use db::entity::common::enums::{AuditOperation, BatchStatus};
use db::entity::enrollment_batches;
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, DatabaseConnection, EntityTrait, Set};
use serde::Deserialize;
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct UpdateBatchBody {
    pub status: Option<BatchStatus>,
    pub student_allocation: Option<i32>,
    pub proximity_percentage: Option<i16>,
    pub staff_percentage: Option<i16>,
    pub sibling_percentage: Option<i16>,
    pub alumni_percentage: Option<i16>,
    pub govt_percentage: Option<i16>,
    pub special_percentage: Option<i16>,
    pub buddhism_percentage: Option<i16>,
    pub catholicism_percentage: Option<i16>,
    pub islam_percentage: Option<i16>,
    pub hinduism_percentage: Option<i16>,
}

#[api_operation(tag = "enrollment-batches", operation_id = "update-batch")]
pub async fn update_batch(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: Json<UpdateBatchBody>,
) -> Result<Json<enrollment_batches::Model>, ApiError> {
    auth.require_permission(Permission::EnrollmentBatchUpdate)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let id = id.into_inner();
    let mut patch = body.into_inner();

    patch.proximity_percentage = patch
        .proximity_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.staff_percentage = patch
        .staff_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.sibling_percentage = patch
        .sibling_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.alumni_percentage = patch
        .alumni_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.govt_percentage = patch
        .govt_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.special_percentage = patch
        .special_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.buddhism_percentage = patch
        .buddhism_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.catholicism_percentage = patch
        .catholicism_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.islam_percentage = patch
        .islam_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;
    patch.hinduism_percentage = patch
        .hinduism_percentage
        .map(|v| crate::validation::Percentage::new(v).map(|p| p.0))
        .transpose()?;

    let existing = enrollment_batches::Entity::find_by_id(id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::not_found("batch not found"))?;

    let pcts = [
        patch
            .proximity_percentage
            .unwrap_or(existing.proximity_percentage),
        patch.staff_percentage.unwrap_or(existing.staff_percentage),
        patch
            .sibling_percentage
            .unwrap_or(existing.sibling_percentage),
        patch
            .alumni_percentage
            .unwrap_or(existing.alumni_percentage),
        patch.govt_percentage.unwrap_or(existing.govt_percentage),
        patch
            .special_percentage
            .unwrap_or(existing.special_percentage),
    ];
    crate::validation::Percentage::sum(&pcts)?;

    let religion_pcts = [
        patch
            .buddhism_percentage
            .unwrap_or(existing.buddhism_percentage),
        patch
            .catholicism_percentage
            .unwrap_or(existing.catholicism_percentage),
        patch.islam_percentage.unwrap_or(existing.islam_percentage),
        patch
            .hinduism_percentage
            .unwrap_or(existing.hinduism_percentage),
    ];
    crate::validation::Percentage::sum(&religion_pcts)?;

    let model = if let Some(new_status) = patch.status {
        if new_status == existing.status {
            existing.clone()
        } else {
            match existing.status {
                BatchStatus::Open => {
                    let batch = Batch::<Open> {
                        model: existing.clone(),
                        _state: PhantomData,
                    };
                    if new_status == BatchStatus::Closed {
                        batch.close()?.into_inner()
                    } else {
                        return Err(ApiError::bad_request("invalid transition from Open"));
                    }
                }
                BatchStatus::Closed => {
                    let batch = Batch::<Closed> {
                        model: existing.clone(),
                        _state: PhantomData,
                    };
                    if new_status == BatchStatus::ListsPublished {
                        batch.publish_lists()?.into_inner()
                    } else {
                        return Err(ApiError::bad_request("invalid transition from Closed"));
                    }
                }
                BatchStatus::ListsPublished => {
                    let batch = Batch::<ListsPublished> {
                        model: existing.clone(),
                        _state: PhantomData,
                    };
                    if new_status == BatchStatus::AppealsPeriod {
                        let deadline = existing
                            .appeal_deadline_at
                            .unwrap_or(chrono::Utc::now() + chrono::Duration::days(14));
                        batch.open_appeals(deadline)?.into_inner()
                    } else {
                        return Err(ApiError::bad_request(
                            "invalid transition from ListsPublished",
                        ));
                    }
                }
                BatchStatus::AppealsPeriod => {
                    let batch = Batch::<AppealsPeriod> {
                        model: existing.clone(),
                        _state: PhantomData,
                    };
                    if new_status == BatchStatus::Archived {
                        batch.archive()?.into_inner()
                    } else {
                        return Err(ApiError::bad_request(
                            "invalid transition from AppealsPeriod",
                        ));
                    }
                }
                BatchStatus::Archived => {
                    return Err(ApiError::bad_request("cannot transition from Archived"));
                }
            }
        }
    } else {
        existing.clone()
    };

    let active = enrollment_batches::ActiveModel {
        id: Set(model.id),
        year: Set(model.year),
        batch_code: Set(model.batch_code),
        batch_name: Set(model.batch_name),
        enrollment_type: Set(model.enrollment_type),
        status: Set(model.status),
        opened_at: Set(model.opened_at),
        closed_at: Set(model.closed_at),
        list_published_at: Set(model.list_published_at),
        appeal_deadline_at: Set(model.appeal_deadline_at),
        finalized_at: Set(model.finalized_at),
        created_at: Set(model.created_at),
        created_by: Set(model.created_by),
        student_allocation: Set(patch.student_allocation.unwrap_or(model.student_allocation)),
        proximity_percentage: Set(pcts[0]),
        staff_percentage: Set(pcts[1]),
        sibling_percentage: Set(pcts[2]),
        alumni_percentage: Set(pcts[3]),
        govt_percentage: Set(pcts[4]),
        special_percentage: Set(pcts[5]),
        buddhism_percentage: Set(religion_pcts[0]),
        catholicism_percentage: Set(religion_pcts[1]),
        islam_percentage: Set(religion_pcts[2]),
        hinduism_percentage: Set(religion_pcts[3]),
        waiting_list_size: Set(model.waiting_list_size),
    };

    let saved = active.update(db.as_ref()).await?;

    let _ = db::entity::audit_logs::ActiveModel {
        id: Set(Uuid::new_v4()),
        table_name: Set("enrollment_batches".to_string()),
        record_id: Set(saved.id),
        action: Set(AuditOperation::Update),
        old_values: Set(crate::audit::to_json(&existing)),
        new_values: Set(crate::audit::to_json(&saved)),
        performed_by: Set(auth.user_id),
        performed_at: Set(chrono::Utc::now()),
        ip_address: Set(None),
        reason: Set(Some(format!("batch {} updated", saved.batch_code))),
    }
    .insert(db.as_ref())
    .await;

    Ok(Json(saved))
}
