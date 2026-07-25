use actix_web::{web, web::Json};
use apistos::api_operation;
use db::entity::districts;
use sea_orm::{DatabaseConnection, EntityTrait};

use crate::error::ApiError;

#[api_operation(tag = "districts", operation_id = "list-districts")]
pub async fn list_districts(
    db: web::Data<DatabaseConnection>,
) -> Result<Json<Vec<districts::Model>>, ApiError> {
    let items = districts::Entity::find().all(db.as_ref()).await?;
    Ok(Json(items))
}
