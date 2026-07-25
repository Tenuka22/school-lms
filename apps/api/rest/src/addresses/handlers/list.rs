use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::common::addresses;
use schemars::JsonSchema;
use sea_orm::{
    DatabaseConnection, EntityTrait, QueryFilter, QueryOrder,
};
use sea_orm::sea_query::{Expr, extension::postgres::PgExpr};
use serde::Deserialize;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Deserialize, JsonSchema, ApiComponent)]
pub struct ListAddressesQuery {
    pub search: Option<String>,
}

#[api_operation(
    tag = "addresses",
    operation_id = "list-addresses"
)]
pub async fn list_addresses(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    query: web::Query<ListAddressesQuery>,
) -> Result<Json<Vec<addresses::Model>>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let mut condition = sea_orm::Condition::all();
    if let Some(q) = &query.search {
        let pattern = format!("%{}%", q.to_lowercase());
        condition = condition.add(
            sea_orm::Condition::any()
                .add(Expr::col(addresses::Column::AddressLine1).ilike(&pattern))
                .add(Expr::col(addresses::Column::AddressLine2).ilike(&pattern))
                .add(Expr::col(addresses::Column::City).ilike(&pattern))
                .add(Expr::col(addresses::Column::District).ilike(&pattern))
                .add(Expr::col(addresses::Column::Province).ilike(&pattern))
                .add(Expr::col(addresses::Column::GsDivision).ilike(&pattern)),
        );
    }

    let results = addresses::Entity::find()
        .filter(condition)
        .order_by_asc(addresses::Column::City)
        .all(db.as_ref())
        .await?;

    Ok(Json(results))
}
