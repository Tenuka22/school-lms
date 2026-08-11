use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::workspace_addresses;
use schemars::JsonSchema;
use sea_orm::sea_query::{Expr, SimpleExpr, extension::postgres::PgExpr};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
use serde::Deserialize;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct ListWorkspaceAddressesQuery {
    pub search: Option<String>,
}

fn ilike(col: workspace_addresses::Column, pattern: &str) -> SimpleExpr {
    Expr::col(col).ilike(pattern)
}

#[api_operation(tag = "workspace_addresses", operation_id = "list-workspace-addresses")]
pub async fn list_workspace_addresses(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    query: web::Query<ListWorkspaceAddressesQuery>,
) -> Result<Json<Vec<workspace_addresses::Model>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationCreate)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let mut condition = sea_orm::Condition::all();
    if let Some(q) = &query.search {
        let pattern = format!("%{}%", q.to_lowercase());
        condition = condition.add(
            sea_orm::Condition::any()
                .add(ilike(workspace_addresses::Column::Name, &pattern))
                .add(ilike(workspace_addresses::Column::FullAddress, &pattern))
                .add(ilike(workspace_addresses::Column::Street1, &pattern))
                .add(ilike(workspace_addresses::Column::City, &pattern)),
        );
    }

    let addresses = workspace_addresses::Entity::find()
        .filter(condition)
        .order_by_asc(workspace_addresses::Column::Name)
        .all(db.as_ref())
        .await?;

    Ok(Json(addresses))
}
