use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use actix_web::{web, web::Json};
use apistos::api_operation;
use apistos::ApiComponent;
use db::entity::guardians;
use db::rbac::Permission;
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, Condition, DatabaseConnection, EntityTrait, QueryFilter};
use serde::Deserialize;

#[derive(Deserialize, ApiComponent, JsonSchema)]
pub struct ListGuardiansQuery {
    pub search: Option<String>,
}

#[api_operation(tag = "guardians", operation_id = "list-guardians")]
pub async fn list_guardians(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    query: web::Query<ListGuardiansQuery>,
) -> Result<Json<Vec<guardians::Model>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let search = query.search.as_deref().unwrap_or("").trim();

    let mut filter = guardians::Entity::find();

    if !search.is_empty() {
        filter = filter.filter(
            Condition::any()
                .add(guardians::Column::FullName.contains(search))
                .add(guardians::Column::NicNumber.contains(search)),
        );
    }

    let items = filter.all(db.as_ref()).await?;
    Ok(Json(items))
}
