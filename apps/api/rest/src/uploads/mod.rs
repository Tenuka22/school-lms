use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::MultipartForm;
use actix_web::web::Json;
use apistos::api_operation;
use apistos::web;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::auth::middleware::AuthenticatedUser;
use crate::docs::MessageResponse;
use crate::error::ApiError;
use crate::storage::Storage;
use db::rbac::Permission;

#[derive(Debug, Deserialize, JsonSchema, apistos::ApiComponent)]
pub struct PresignedUploadRequest {
    pub file_name: String,
    pub content_type: String,
    pub file_size: i64,
}

#[derive(Debug, Serialize, JsonSchema, apistos::ApiComponent)]
pub struct PresignedUploadResponse {
    pub key: String,
    pub url: String,
    pub public_url: String,
    pub file_name: String,
    pub content_type: String,
    pub file_size: i64,
}

#[derive(Debug, MultipartForm, schemars::JsonSchema, apistos::ApiComponent)]
pub struct UploadForm {
    #[schemars(skip)]
    pub file: TempFile,
}

#[derive(Serialize, schemars::JsonSchema, apistos::ApiComponent)]
pub struct UploadResponse {
    pub key: String,
    pub url: String,
    pub file_name: String,
    pub size: usize,
}

#[api_operation(tag = "uploads", operation_id = "presigned-upload-url")]
pub async fn presigned_upload_url(
    storage: actix_web::web::Data<Storage>,
    auth: AuthenticatedUser,
    body: Json<PresignedUploadRequest>,
) -> Result<Json<PresignedUploadResponse>, ApiError> {
    auth.require_permission(Permission::FileUpload)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let req = body.into_inner();

    if req.file_size <= 0 {
        return Err(ApiError::BadRequest("file_size must be positive".into()));
    }
    if req.file_size > 25 * 1024 * 1024 {
        return Err(ApiError::BadRequest("file exceeds 25MB limit".into()));
    }

    let key = format!(
        "{}-{}",
        uuid::Uuid::new_v4(),
        sanitize_filename(&req.file_name)
    );

    let url = storage
        .presigned_put_url(&key, &req.content_type, 600)
        .await
        .map_err(|e| {
            log::error!("minio presigned_put_url failed: {e}");
            ApiError::Internal("failed to generate upload URL".into())
        })?;

    let public_url = storage.public_url(&key);

    Ok(Json(PresignedUploadResponse {
        key,
        url,
        public_url,
        file_name: req.file_name,
        content_type: req.content_type,
        file_size: req.file_size,
    }))
}

#[api_operation(tag = "uploads", operation_id = "upload-file")]
pub async fn upload_file(
    storage: actix_web::web::Data<Storage>,
    auth: AuthenticatedUser,
    MultipartForm(form): MultipartForm<UploadForm>,
) -> Result<Json<UploadResponse>, ApiError> {
    auth.require_permission(Permission::FileUpload)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;

    let file = form.file;
    let file_name = file
        .file_name
        .clone()
        .unwrap_or_else(|| "upload.bin".to_string());

    let size = file.size;
    if size == 0 {
        return Err(ApiError::BadRequest("empty file".into()));
    }
    if size > 25 * 1024 * 1024 {
        return Err(ApiError::BadRequest("file exceeds 25MB limit".into()));
    }

    let data = std::fs::read(&file.file.path()).map_err(|e| {
        log::error!("failed to read uploaded temp file: {e}");
        ApiError::Internal("failed to read upload".into())
    })?;

    let content_type = file
        .content_type
        .map(|m| m.to_string())
        .unwrap_or_else(|| "application/octet-stream".to_string());

    let key = format!(
        "{}-{}",
        uuid::Uuid::new_v4(),
        sanitize_filename(&file_name)
    );

    storage
        .put_object(&key, data, &content_type)
        .await
        .map_err(|e| {
            log::error!("minio put_object failed: {e}");
            ApiError::Internal("upload failed".into())
        })?;

    let url = storage.public_url(&key);

    Ok(Json(UploadResponse {
        key,
        url,
        file_name,
        size,
    }))
}

#[api_operation(tag = "uploads", operation_id = "delete-upload")]
pub async fn delete_upload(
    storage: actix_web::web::Data<Storage>,
    auth: AuthenticatedUser,
    key: actix_web::web::Path<String>,
) -> Result<Json<MessageResponse>, ApiError> {
    auth.require_permission(Permission::FileUpload)
        .map_err(|_| ApiError::Forbidden("insufficient permissions".into()))?;
    let key = key.into_inner();
    storage.delete_object(&key).await.map_err(|e| {
        log::error!("minio delete_object failed: {e}");
        ApiError::Internal("failed to delete file".into())
    })?;
    Ok(Json(MessageResponse { message: "file deleted".into() }))
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' { c } else { '_' })
        .collect()
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/uploads/presigned", web::post().to(presigned_upload_url));
    cfg.route("/uploads", web::post().to(upload_file));
    cfg.route("/uploads/{key}", web::delete().to(delete_upload));
}
