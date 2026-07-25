use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::g1::children;
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter};
use serde::Deserialize;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, ApiComponent, JsonSchema)]
pub struct ListChildrenQuery {
    pub search: Option<String>,
}

#[api_operation(tag = "children", operation_id = "list-children")]
pub async fn list_children(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    query: web::Query<ListChildrenQuery>,
) -> Result<Json<Vec<children::Model>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let search = query.search.as_deref().unwrap_or("").trim();

    let mut filter = children::Entity::find();

    if !search.is_empty() {
        filter = filter.filter(
            Condition::any()
                .add(children::Column::FullName.contains(search))
                .add(children::Column::NameWithInitials.contains(search)),
        );
    }

    let items = filter.all(db.as_ref()).await?;
    Ok(Json(items))
}
