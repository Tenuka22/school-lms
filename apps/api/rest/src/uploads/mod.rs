use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::MultipartForm;
use actix_web::web::Json;
use apistos::api_operation;
use apistos::web;
use serde::Serialize;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use crate::storage::Storage;
use db::rbac::Permission;

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

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' { c } else { '_' })
        .collect()
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/uploads", web::post().to(upload_file));
}
