use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::schools;
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter};
use serde::Deserialize;

use crate::error::ApiError;

#[derive(Deserialize, ApiComponent, JsonSchema)]
pub struct ListSchoolsQuery {
    pub search: Option<String>,
}

#[api_operation(tag = "schools", operation_id = "list-schools")]
pub async fn list_schools(
    db: web::Data<DatabaseConnection>,
    query: web::Query<ListSchoolsQuery>,
) -> Result<Json<Vec<SchoolSummary>>, ApiError> {
    let search = query.search.as_deref().unwrap_or("").trim();

    let mut filter = schools::Entity::find();

    if !search.is_empty() {
        filter = filter.filter(
            Condition::any()
                .add(schools::Column::SchoolNameSi.contains(search))
                .add(schools::Column::SchoolNameEn.contains(search)),
        );
    }

    let items = filter.all(db.as_ref()).await?;

    let result: Vec<SchoolSummary> = items
        .into_iter()
        .map(|s| SchoolSummary {
            id: s.id,
            name_si: s.school_name_si,
            name_en: s.school_name_en,
            district_id: s.district_id,
        })
        .collect();

    Ok(Json(result))
}

#[derive(serde::Serialize, schemars::JsonSchema, apistos::ApiComponent)]
pub struct SchoolSummary {
    pub id: uuid::Uuid,
    pub name_si: String,
    pub name_en: Option<String>,
    pub district_id: Option<uuid::Uuid>,
}
