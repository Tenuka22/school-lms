use actix_web::web;
use apistos::api_operation;
use apistos::ApiComponent;
use chrono::Utc;
use db::entity::common::enums::{DocumentVerificationStatus, G1DocumentType};
use db::entity::g1::{applications, documents};
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use db::rbac::Permission;

#[derive(Debug, Deserialize, JsonSchema, ApiComponent)]
pub struct SaveDocumentEntry {
    pub doc_type: String,
    pub file_url: String,
    pub file_key: String,
    pub content_type: Option<String>,
    pub file_size: Option<i64>,
}

#[derive(Debug, Deserialize, JsonSchema, ApiComponent)]
pub struct SaveDocumentsRequest {
    pub documents: Vec<SaveDocumentEntry>,
}

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct SaveDocumentsResponse {
    pub count: usize,
}

fn parse_doc_type(s: &str) -> Option<G1DocumentType> {
    match s {
        "BirthCertificate" => Some(G1DocumentType::BirthCertificate),
        "GuardianNIC" => Some(G1DocumentType::GuardianNIC),
        "ResidenceProof" => Some(G1DocumentType::ResidenceProof),
        "SiblingSchoolCertificate" => Some(G1DocumentType::SiblingSchoolCertificate),
        "StaffAppointmentLetter" => Some(G1DocumentType::StaffAppointmentLetter),
        "StaffServiceCertificate" => Some(G1DocumentType::StaffServiceCertificate),
        "PastPupilCertificate" | "AlumniCertificate" => Some(G1DocumentType::PastPupilCertificate),
        "PastPupilExamCert" => Some(G1DocumentType::PastPupilExamCert),
        "GovtServiceCertificate" | "GovtEmployeeCertificate" => Some(G1DocumentType::GovtServiceCertificate),
        "DisabilityCertificate" => Some(G1DocumentType::DisabilityCertificate),
        "IncomeCertificate" => Some(G1DocumentType::IncomeCertificate),
        "BaptismCertificate" => Some(G1DocumentType::BaptismCertificate),
        "Other" => Some(G1DocumentType::Other),
        _ => None,
    }
}

#[api_operation(tag = "g1-applications", operation_id = "save-application-documents")]
pub async fn save_application_documents(
    db: web::Data<DatabaseConnection>,
    auth: AuthenticatedUser,
    id: web::Path<Uuid>,
    body: web::Json<SaveDocumentsRequest>,
) -> Result<web::Json<SaveDocumentsResponse>, ApiError> {
    auth.require_permission(Permission::G1ApplicationUpdate)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let app_id = id.into_inner();
    let user_id = auth.user_id;

    applications::Entity::find_by_id(app_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("Application not found".into()))?;

    // Delete existing documents for this application
    documents::Entity::delete_many()
        .filter(documents::Column::ApplicationId.eq(app_id))
        .exec(db.as_ref())
        .await?;

    let mut count = 0;
    let now = Utc::now();

    for entry in &body.documents {
        let doc_type = match parse_doc_type(&entry.doc_type) {
            Some(t) => t,
            None => {
                log::warn!("[save_documents] unknown doc_type: {}", entry.doc_type);
                continue;
            }
        };

        documents::ActiveModel {
            id: Set(Uuid::new_v4()),
            application_id: Set(app_id),
            document_type: Set(doc_type),
            file_url: Set(entry.file_url.clone()),
            file_key: Set(entry.file_key.clone()),
            file_hash: Set(None),
            file_size: Set(entry.file_size),
            content_type: Set(entry.content_type.clone()),
            uploaded_at: Set(now),
            verification_status: Set(DocumentVerificationStatus::Pending),
            verified_by: Set(None),
            verified_at: Set(None),
            rejection_reason: Set(None),
            fraud_flag: Set(false),
            created_at: Set(now),
            updated_at: Set(now),
        }
        .insert(db.as_ref())
        .await?;
        count += 1;
    }

    Ok(web::Json(SaveDocumentsResponse { count }))
}
