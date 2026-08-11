use actix_web::{web, web::Json};
use apistos::ApiComponent;
use apistos::api_operation;
use db::entity::g1::{applications, documents};
use schemars::JsonSchema;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Serialize, Deserialize, JsonSchema, ApiComponent)]
pub struct DocumentEntry {
    pub doc_type: String,
    pub file_url: String,
    pub file_key: String,
    pub file_name: Option<String>,
    pub content_type: Option<String>,
    pub file_size: Option<i64>,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct GetDocumentsResponse {
    pub documents: Vec<DocumentEntry>,
}

#[api_operation(tag = "g1-applications", operation_id = "get-application-documents")]
pub async fn get_application_documents(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
) -> Result<Json<GetDocumentsResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationRead)
        .map_err(|_| ApiError::forbidden("insufficient permissions"))?;

    let app_id = id.into_inner();

    applications::Entity::find_by_id(app_id)
        .filter(applications::Column::DeletedAt.is_null())
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::not_found("application not found"))?;

    let docs = documents::Entity::find()
        .filter(documents::Column::ApplicationId.eq(app_id))
        .all(db.as_ref())
        .await?;

    let entries = docs
        .into_iter()
        .map(|d| DocumentEntry {
            doc_type: format!("{:?}", d.document_type),
            file_url: d.file_url,
            file_key: d.file_key,
            file_name: None,
            content_type: d.content_type,
            file_size: d.file_size,
        })
        .collect();

    Ok(Json(GetDocumentsResponse { documents: entries }))
}
