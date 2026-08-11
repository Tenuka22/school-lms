use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::common::enums::GuardianRelationship;
use db::entity::g1::{children, join_guardians};
use db::entity::guardians;
use db::rbac::Permission;
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, ApiComponent, JsonSchema)]
pub struct ListGuardiansQuery {
    pub search: Option<String>,
    pub is_past_pupil: Option<String>,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent, Clone)]
pub struct ChildInfo {
    pub id: uuid::Uuid,
    pub full_name: String,
    pub name_with_initials: String,
    pub date_of_birth: chrono::NaiveDate,
    pub gender: db::entity::common::enums::Gender,
    pub current_grade: Option<i16>,
    pub student_id: Option<uuid::Uuid>,
    pub status: db::entity::common::enums::StudentStatus,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent, Clone)]
pub struct GuardianWithChildren {
    pub id: uuid::Uuid,
    pub relationship_type: GuardianRelationship,
    pub full_name: String,
    pub nic_number: String,
    pub contact_phone: String,
    pub contact_email: Option<String>,
    pub occupation: Option<String>,
    pub workplace_name: Option<String>,
    pub workplace_address: Option<String>,
    pub is_govt_employee: bool,
    pub govt_service_years: Option<i32>,
    pub is_school_staff: bool,
    pub is_past_pupil: bool,
    pub past_pupil_verified: bool,
    pub income_level: Option<db::entity::common::enums::IncomeLevel>,
    pub student_id: Option<uuid::Uuid>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub children: Vec<ChildInfo>,
}

#[api_operation(tag = "guardians", operation_id = "list-guardians")]
pub async fn list_guardians(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    query: web::Query<ListGuardiansQuery>,
) -> Result<Json<Vec<GuardianWithChildren>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let search = query.search.as_deref().unwrap_or("").trim();
    let is_past_pupil = query.is_past_pupil.as_deref().unwrap_or("").trim();

    let mut filter = guardians::Entity::find().order_by_asc(guardians::Column::FullName);

    if !search.is_empty() {
        filter = filter.filter(
            Condition::any()
                .add(guardians::Column::FullName.contains(search))
                .add(guardians::Column::NicNumber.contains(search))
                .add(guardians::Column::ContactPhone.contains(search)),
        );
    }

    if !is_past_pupil.is_empty() {
        if is_past_pupil == "true" {
            filter = filter.filter(guardians::Column::IsPastPupil.eq(true));
        } else if is_past_pupil == "false" {
            filter = filter.filter(guardians::Column::IsPastPupil.eq(false));
        }
    }

    let guardians_list = filter.all(db.as_ref()).await?;

    let guardian_ids: Vec<uuid::Uuid> = guardians_list.iter().map(|g| g.id).collect();

    let joins = join_guardians::Entity::find()
        .filter(join_guardians::Column::GuardianId.is_in(guardian_ids.clone()))
        .all(db.as_ref())
        .await?;

    let application_ids: Vec<uuid::Uuid> = joins.iter().map(|j| j.application_id).collect();

    let apps = if application_ids.is_empty() {
        vec![]
    } else {
        db::entity::g1::applications::Entity::find()
            .filter(db::entity::g1::applications::Column::Id.is_in(application_ids.clone()))
            .all(db.as_ref())
            .await?
    };

    let child_ids: Vec<uuid::Uuid> = apps.iter().map(|a| a.child_id).collect();

    let child_models = if child_ids.is_empty() {
        vec![]
    } else {
        children::Entity::find()
            .filter(children::Column::Id.is_in(child_ids))
            .all(db.as_ref())
            .await?
    };

    let mut child_map = std::collections::HashMap::new();
    for child in child_models {
        child_map.insert(child.id, child);
    }

    let mut app_to_guardian = std::collections::HashMap::new();
    for join in &joins {
        app_to_guardian
            .entry(join.application_id)
            .or_insert_with(Vec::new)
            .push(join.guardian_id);
    }

    let mut guardian_children: std::collections::HashMap<uuid::Uuid, Vec<ChildInfo>> =
        std::collections::HashMap::new();
    for app in &apps {
        if let Some(child) = child_map.get(&app.child_id) {
            let info = ChildInfo {
                id: child.id,
                full_name: child.full_name.clone(),
                name_with_initials: child.name_with_initials.clone(),
                date_of_birth: child.date_of_birth,
                gender: child.gender.clone(),
                current_grade: child.current_grade,
                student_id: child.student_id,
                status: child.status.clone(),
            };
            if let Some(guardian_ids_for_app) = app_to_guardian.get(&app.id) {
                for gid in guardian_ids_for_app {
                    guardian_children
                        .entry(*gid)
                        .or_insert_with(Vec::new)
                        .push(info.clone());
                }
            }
        }
    }

    let result: Vec<GuardianWithChildren> = guardians_list
        .into_iter()
        .map(|g| GuardianWithChildren {
            id: g.id,
            relationship_type: g.relationship_type,
            full_name: g.full_name,
            nic_number: g.nic_number,
            contact_phone: g.contact_phone,
            contact_email: g.contact_email,
            occupation: g.occupation,
            workplace_name: g.workplace_name,
            workplace_address: g.workplace_address,
            is_govt_employee: g.is_govt_employee,
            govt_service_years: g.govt_service_years,
            is_school_staff: g.is_school_staff,
            is_past_pupil: g.is_past_pupil,
            past_pupil_verified: g.past_pupil_verified,
            income_level: g.income_level,
            student_id: g.student_id,
            created_at: g.created_at,
            children: guardian_children.remove(&g.id).unwrap_or_default(),
        })
        .collect();

    Ok(Json(result))
}
