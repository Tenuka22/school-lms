use std::str::FromStr;

use actix_web::{web, web::Json};
use apistos::actix::CreatedJson;
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::entity::common::enums::{AuditOperation, BatchStatus, EnrollmentStatus, IncomeLevel};
use db::entity::g1::applications;
use db::entity::{enrollment_batches, schools};
use num_traits::ToPrimitive;
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

    let id = Uuid::new_v4();
    let count = applications::Entity::find()
        .filter(applications::Column::BatchId.eq(batch.id))
        .filter(applications::Column::DeletedAt.is_null())
        .count(db.as_ref())
        .await?;

    let active = applications::ActiveModel {
        id: Set(id),
        reference_no: Set(format!("{}-{:04}", batch.batch_code, count + 1)),
        school_id: Set(data.school_id),
        batch_id: Set(data.batch_id),
        enrollment_status: Set(EnrollmentStatus::Draft),
        created_at: Set(now),
        updated_at: Set(now),
        created_by: Set(None),
        updated_by: Set(None),
        child_id: Set(data.child_id.unwrap_or(Uuid::nil())),
        guardian_id: Set(Uuid::nil()),
        wizard_step: Set(None),
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

    if existing.enrollment_status != EnrollmentStatus::Pending {
        return Err(ApiError::BadRequest(
            "only pending applications can be submitted".into(),
        ));
    }

    let txn = db.begin().await?;

    let mut active: applications::ActiveModel = existing.clone().into();
    active.enrollment_status = Set(EnrollmentStatus::Completed);
    active.submitted_at = Set(Some(Utc::now()));
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

#[api_operation(tag = "g1-applications", operation_id = "calculate-marks")]
pub async fn calculate_marks(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<applications::Model>, ApiError> {
    auth.require_permission(Permission::G1ApplicationMark)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let id = id.into_inner();

    let existing = applications::Entity::find_by_id(id)
        .filter(applications::Column::DeletedAt.is_null())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("application not found".into()))?;

    if existing.enrollment_status != EnrollmentStatus::Completed {
        return Err(ApiError::BadRequest(
            "only completed applications can be marked".into(),
        ));
    }

    let txn = db.begin().await?;

    let total_marks = calculate_proximity_marks(db.as_ref(), &existing)
        .await?
        .unwrap_or(0.0);

    let staff_marks = calculate_staff_marks(db.as_ref(), &existing)
        .await?
        .unwrap_or(0.0);

    let sibling_marks = calculate_sibling_marks(db.as_ref(), &existing)
        .await?
        .unwrap_or(0.0);

    let alumni_marks = calculate_alumni_marks(db.as_ref(), &existing)
        .await?
        .unwrap_or(0.0);

    let govt_marks = calculate_govt_marks(db.as_ref(), &existing)
        .await?
        .unwrap_or(0.0);

    let special_marks = calculate_special_marks(db.as_ref(), &existing)
        .await?
        .unwrap_or(0.0);

    let final_total =
        (total_marks + staff_marks + sibling_marks + alumni_marks + govt_marks + special_marks)
            .round()
            .max(0.0)
            .min(100.0);

    let categories = vec![
        ("PROX", total_marks, 50.0),
        ("STAFF", staff_marks, 25.0),
        ("SIBLING", sibling_marks, 14.0),
        ("ALUMNI", alumni_marks, 6.0),
        ("GOVT", govt_marks, 4.0),
        ("SPECIAL", special_marks, 1.0),
    ];

    for (code, weighted, weight) in categories {
        if weighted > 0.0 {
            let raw = (weighted / weight * 100.0).round().min(100.0);
            db::entity::g1::marks_breakdown::ActiveModel {
                id: Set(Uuid::new_v4()),
                application_id: Set(id),
                category_code: Set(code.to_string()),
                raw_marks: Set(Some(
                    sea_orm::prelude::Decimal::from_str(&format!("{:.2}", raw)).unwrap_or_default(),
                )),
                max_raw_marks: Set(Some(sea_orm::prelude::Decimal::from(100))),
                weight_percentage: Set(Some(
                    sea_orm::prelude::Decimal::from_str(&format!("{:.2}", weight))
                        .unwrap_or_default(),
                )),
                weighted_score: Set(Some(
                    sea_orm::prelude::Decimal::from_str(&format!("{:.2}", weighted))
                        .unwrap_or_default(),
                )),
                distance_km: Set(None),
                distance_band: Set(None),
                calculated_at: Set(Utc::now()),
                calculation_rule: Set(Some("default".to_string())),
            }
            .insert(&txn)
            .await?;
        }
    }

    let mut active: applications::ActiveModel = existing.clone().into();
    active.total_marks = Set(Some(
        sea_orm::prelude::Decimal::from_str(&format!("{:.2}", final_total)).unwrap_or_default(),
    ));
    active.enrollment_status = Set(EnrollmentStatus::PendingApproval);
    active.updated_at = Set(Utc::now());

    let saved = active.update(&txn).await?;

    let _ = create_audit_log(
        db.as_ref(),
        Some(id),
        AuditOperation::Mark,
        None,
        serde_json::to_value(&saved).ok(),
        None,
        auth,
    )
    .await;

    txn.commit().await?;

    Ok(Json(saved))
}

#[api_operation(tag = "g1-applications", operation_id = "generate-admission-lists")]
pub async fn generate_admission_lists(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    body: Json<GenerateListsRequest>,
) -> Result<Json<GenerateListsResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationGenerateLists)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let batch_id = body.batch_id;

    let batch = enrollment_batches::Entity::find_by_id(batch_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::BadRequest("batch not found".into()))?;

    if batch.status != BatchStatus::Closed {
        return Err(ApiError::BadRequest(
            "batch must be closed before generating lists".into(),
        ));
    }

    let school_list = schools::Entity::find().all(db.as_ref()).await?;

    let mut school_summaries = Vec::new();

    for school in school_list {
        let marked_apps = applications::Entity::find()
            .filter(applications::Column::SchoolId.eq(Some(school.id)))
            .filter(applications::Column::EnrollmentStatus.eq(EnrollmentStatus::PendingApproval))
            .filter(applications::Column::DeletedAt.is_null())
            .all(db.as_ref())
            .await?;

        let mut sorted: Vec<_> = marked_apps
            .into_iter()
            .map(|a| {
                (
                    a.total_marks.unwrap_or_default(),
                    a.submitted_at.unwrap_or_default(),
                    a.id,
                )
            })
            .collect();

        sorted.sort_by(|a, b| {
            b.0.partial_cmp(&a.0)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| a.1.cmp(&b.1).reverse())
        });

        let quota = school.grade_1_quota as usize;
        let main_list_count = quota.min(sorted.len());
        let waiting_list_count = (quota + 20).min(sorted.len()) - main_list_count;

        for (idx, (_, _, app_id)) in sorted.iter().enumerate() {
            let list_type = if idx < main_list_count {
                db::entity::common::enums::AdmissionListType::MainList
            } else {
                db::entity::common::enums::AdmissionListType::WaitingList
            };

            let position = if idx < main_list_count {
                Some((idx + 1) as i32)
            } else {
                Some((idx + 1 - main_list_count) as i32)
            };

            db::entity::g1::admission_lists::ActiveModel {
                id: Set(Uuid::new_v4()),
                application_id: Set(*app_id),
                school_id: Set(school.id),
                list_type: Set(list_type),
                position_number: Set(position),
                quota_category: Set(db::entity::common::enums::QuotaCategory::General),
                admitted: Set(false),
                admitted_at: Set(None),
                admitted_by: Set(None),
                waiting_position: Set(if idx >= main_list_count {
                    position
                } else {
                    None
                }),
                promoted_at: Set(None),
                promoted_from: Set(None),
                created_at: Set(Utc::now()),
            }
            .insert(db.as_ref())
            .await?;
        }

        school_summaries.push(SchoolListSummary {
            school_id: school.id,
            school_name: school.school_name_si.clone(),
            main_list_count,
            waiting_list_count,
        });
    }

    let total_generated: usize = school_summaries
        .iter()
        .map(|s| s.main_list_count + s.waiting_list_count)
        .sum();

    Ok(Json(GenerateListsResponse {
        batch_id,
        schools: school_summaries,
        total_generated,
    }))
}

async fn calculate_proximity_marks(
    db: &DatabaseConnection,
    application: &applications::Model,
) -> Result<Option<f64>, ApiError> {
    let app_addresses = db::entity::g1::join_addresses::Entity::find()
        .filter(db::entity::g1::join_addresses::Column::ApplicationId.eq(application.id))
        .filter(db::entity::g1::join_addresses::Column::IsPrimary.eq(true))
        .one(db)
        .await?;

    let address = if let Some(ja) = app_addresses {
        db::entity::common::addresses::Entity::find_by_id(ja.address_id)
            .one(db)
            .await?
            .ok_or_else(|| ApiError::NotFound("address not found".into()))?
    } else {
        return Ok(None);
    };

    let school_id = match application.school_id {
        Some(id) => id,
        None => return Ok(None),
    };
    let school = schools::Entity::find_by_id(school_id)
        .one(db)
        .await?
        .ok_or_else(|| ApiError::NotFound("school not found".into()))?;

    let distance_km = if let (Some(lat1), Some(lon1), Some(lat2), Some(lon2)) = (
        address.latitude,
        address.longitude,
        school.geo_latitude,
        school.geo_longitude,
    ) {
        haversine_distance(lat1, lon1, lat2, lon2)
    } else {
        return Ok(None);
    };

    let raw = if distance_km < 0.5 {
        100.0
    } else if distance_km < 1.0 {
        80.0
    } else if distance_km < 2.0 {
        60.0
    } else if distance_km < 3.0 {
        40.0
    } else if distance_km < 5.0 {
        20.0
    } else {
        10.0
    };

    let weighted = (raw / 100.0) * 50.0;

    Ok(Some(weighted))
}

async fn calculate_staff_marks(
    db: &DatabaseConnection,
    application: &applications::Model,
) -> Result<Option<f64>, ApiError> {
    let staff_joins = db::entity::g1::join_staff_details::Entity::find()
        .filter(db::entity::g1::join_staff_details::Column::ApplicationId.eq(application.id))
        .all(db)
        .await?;

    if staff_joins.is_empty() {
        return Ok(None);
    }

    let mut total_weighted: f64 = 0.0;

    for join in staff_joins {
        let staff = db::entity::common::staff_details::Entity::find_by_id(join.staff_detail_id)
            .one(db)
            .await?
            .ok_or_else(|| ApiError::NotFound("staff detail not found".into()))?;

        if !staff.is_current {
            continue;
        }

        if Some(staff.school_id) != application.school_id {
            continue;
        }

        let mut raw = 100.0;

        if let Some(dist) = staff.distance_from_residence_km {
            if dist.to_f64().unwrap_or(0.0) > 100.0 {
                raw *= 0.8;
            }
        }

        if let Some(emp_type) = staff.employment_type {
            match emp_type {
                db::entity::common::enums::StaffEmploymentType::Permanent => {}
                db::entity::common::enums::StaffEmploymentType::Temporary => {
                    raw *= 0.5;
                }
                db::entity::common::enums::StaffEmploymentType::Contract => {}
            }
        }

        let weighted = (raw / 100.0) * 25.0;
        total_weighted += weighted;
    }

    Ok(Some(total_weighted.min(25.0)))
}

async fn calculate_sibling_marks(
    db: &DatabaseConnection,
    application: &applications::Model,
) -> Result<Option<f64>, ApiError> {
    let sibling_joins = db::entity::g1::join_siblings::Entity::find()
        .filter(db::entity::g1::join_siblings::Column::ApplicationId.eq(application.id))
        .all(db)
        .await?;

    if sibling_joins.is_empty() {
        return Ok(None);
    }

    let mut total_weighted: f64 = 0.0;

    for join in sibling_joins {
        let sibling = db::entity::common::siblings::Entity::find_by_id(join.sibling_id)
            .one(db)
            .await?
            .ok_or_else(|| ApiError::NotFound("sibling not found".into()))?;

        if !sibling.verified {
            continue;
        }

        if Some(sibling.school_id) != application.school_id {
            continue;
        }

        let raw = 100.0;
        let weighted = (raw / 100.0) * 14.0;
        total_weighted += weighted;
    }

    Ok(Some(total_weighted.min(14.0)))
}

async fn calculate_alumni_marks(
    db: &DatabaseConnection,
    application: &applications::Model,
) -> Result<Option<f64>, ApiError> {
    let alumni_joins = db::entity::g1::join_past_pupil_details::Entity::find()
        .filter(db::entity::g1::join_past_pupil_details::Column::ApplicationId.eq(application.id))
        .all(db)
        .await?;

    if alumni_joins.is_empty() {
        return Ok(None);
    }

    let mut total_weighted: f64 = 0.0;

    for join in alumni_joins {
        let alumni =
            db::entity::common::past_pupil_details::Entity::find_by_id(join.past_pupil_detail_id)
                .one(db)
                .await?
                .ok_or_else(|| ApiError::NotFound("past pupil detail not found".into()))?;

        if !alumni.verified {
            continue;
        }

        if Some(alumni.school_id) != application.school_id {
            continue;
        }

        let raw = match alumni.highest_grade.as_deref() {
            Some("GCE_AL") | Some("GCE_OL") => 100.0,
            Some("Grade_11") => 80.0,
            Some("Grade_10") => 60.0,
            _ => 40.0,
        };

        let weighted = (raw / 100.0) * 6.0;
        total_weighted += weighted;
    }

    Ok(Some(total_weighted.min(6.0)))
}

async fn calculate_govt_marks(
    db: &DatabaseConnection,
    application: &applications::Model,
) -> Result<Option<f64>, ApiError> {
    let guardian_joins = db::entity::g1::join_guardians::Entity::find()
        .filter(db::entity::g1::join_guardians::Column::ApplicationId.eq(application.id))
        .filter(db::entity::g1::join_guardians::Column::IsPrimary.eq(true))
        .one(db)
        .await?;

    let guardian = match guardian_joins {
        Some(gj) => db::entity::common::guardians::Entity::find_by_id(gj.guardian_id)
            .one(db)
            .await?
            .ok_or_else(|| ApiError::NotFound("guardian not found".into()))?,
        None => return Ok(None),
    };

    if !guardian.is_govt_employee {
        return Ok(None);
    }

    let years = guardian.govt_service_years.unwrap_or(0);

    let raw = if years >= 20 {
        100.0
    } else if years >= 15 {
        80.0
    } else if years >= 10 {
        60.0
    } else if years >= 5 {
        40.0
    } else {
        20.0
    };

    let weighted = (raw / 100.0) * 4.0;

    Ok(Some(weighted))
}

async fn calculate_special_marks(
    db: &DatabaseConnection,
    application: &applications::Model,
) -> Result<Option<f64>, ApiError> {
    let mut raw: f64 = 0.0;

    let guardian_joins = db::entity::g1::join_guardians::Entity::find()
        .filter(db::entity::g1::join_guardians::Column::ApplicationId.eq(application.id))
        .filter(db::entity::g1::join_guardians::Column::IsPrimary.eq(true))
        .one(db)
        .await?;

    let guardian = match guardian_joins {
        Some(gj) => match db::entity::common::guardians::Entity::find_by_id(gj.guardian_id)
            .one(db)
            .await
        {
            Ok(Some(g)) => g,
            _ => return Ok(Some((raw.min(100.0) / 100.0) * 1.0)),
        },
        None => return Ok(Some((raw.min(100.0) / 100.0) * 1.0)),
    };

    let is_low_income = guardian.income_level.map_or(false, |v| {
        matches!(
            v,
            IncomeLevel::Below25000 | IncomeLevel::Between25000And50000
        )
    });
    if is_low_income {
        raw += 10.0;
    }

    let final_raw = raw.min(100.0);
    let weighted = (final_raw / 100.0) * 1.0;

    Ok(Some(weighted))
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

fn haversine_distance(
    lat1: sea_orm::prelude::Decimal,
    lon1: sea_orm::prelude::Decimal,
    lat2: sea_orm::prelude::Decimal,
    lon2: sea_orm::prelude::Decimal,
) -> f64 {
    let r = 6371.0;
    let d_lat = (lat2 - lat1).to_f64().unwrap_or(0.0).to_radians();
    let d_lon = (lon2 - lon1).to_f64().unwrap_or(0.0).to_radians();
    let lat1_rad = lat1.to_f64().unwrap_or(0.0).to_radians();
    let lat2_rad = lat2.to_f64().unwrap_or(0.0).to_radians();

    let a =
        (d_lat / 2.0).sin().powi(2) + lat1_rad.cos() * lat2_rad.cos() * (d_lon / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().asin();

    r * c
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

#[derive(
    Debug, serde::Serialize, serde::Deserialize, schemars::JsonSchema, apistos::ApiComponent,
)]
pub struct GenerateListsRequest {
    pub batch_id: Uuid,
}

#[derive(
    Debug, serde::Serialize, serde::Deserialize, schemars::JsonSchema, apistos::ApiComponent,
)]
pub struct SchoolListSummary {
    pub school_id: Uuid,
    pub school_name: String,
    pub main_list_count: usize,
    pub waiting_list_count: usize,
}

#[derive(Debug, serde::Serialize, schemars::JsonSchema, apistos::ApiComponent)]
pub struct GenerateListsResponse {
    pub batch_id: Uuid,
    pub schools: Vec<SchoolListSummary>,
    pub total_generated: usize,
}
