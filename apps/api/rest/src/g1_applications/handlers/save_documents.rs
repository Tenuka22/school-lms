use actix_web::web;
use apistos::ApiComponent;
use apistos::api_operation;
use db::domain::document::{Document, Uploaded};
use db::entity::common::enums::G1DocumentType;
use db::entity::g1::{applications, documents};
use schemars::JsonSchema;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
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
        "ElectoralProof" => Some(G1DocumentType::ElectoralProof),
        "SiblingSchoolCertificate" => Some(G1DocumentType::SiblingSchoolCertificate),
        "StaffAppointmentLetter" => Some(G1DocumentType::StaffAppointmentLetter),
        "StaffServiceCertificate" => Some(G1DocumentType::StaffServiceCertificate),
        "PastPupilCertificate" | "AlumniCertificate" => Some(G1DocumentType::PastPupilCertificate),
        "PastPupilExamCert" => Some(G1DocumentType::PastPupilExamCert),
        "GovtServiceCertificate" | "GovtEmployeeCertificate" => {
            Some(G1DocumentType::GovtServiceCertificate)
        }
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

    applications::Entity::find_by_id(app_id)
        .one(db.as_ref())
        .await?
        .ok_or_else(|| ApiError::NotFound("Application not found".into()))?;

    documents::Entity::delete_many()
        .filter(documents::Column::ApplicationId.eq(app_id))
        .exec(db.as_ref())
        .await?;

    let mut count = 0;

    for entry in &body.documents {
        let doc_type = match parse_doc_type(&entry.doc_type) {
            Some(t) => t,
            None => {
                log::warn!("[save_documents] unknown doc_type: {}", entry.doc_type);
                continue;
            }
        };

        let _ = crate::validation::NonEmpty::new(entry.doc_type.clone(), "doc_type")?;
        let validated_file_url =
            crate::validation::Url::new(entry.file_url.clone())?.into_inner();
        let validated_file_key =
            crate::validation::NonEmpty::new(entry.file_key.clone(), "file_key")?.into_inner();
        let validated_content_type = entry
            .content_type
            .as_ref()
            .map(|v| {
                crate::validation::NonEmpty::new(v.clone(), "content_type")
                    .map(|x| x.into_inner())
            })
            .transpose()?;

        let doc = Document::<Uploaded>::new(app_id, doc_type, validated_file_url, validated_file_key);

        let mut model = doc.into_inner();
        model.file_size = entry.file_size;
        model.content_type = validated_content_type;

        let active: documents::ActiveModel = model.into();
        active.insert(db.as_ref()).await?;
        count += 1;
    }

    Ok(web::Json(SaveDocumentsResponse { count }))
}
