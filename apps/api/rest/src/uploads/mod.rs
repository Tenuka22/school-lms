use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::MultipartForm;
use actix_web::{HttpResponse, web};
use serde::Serialize;
use utoipa::ToSchema;

use crate::auth::middleware::AuthenticatedUser;
use crate::error::ApiError;
use crate::storage::Storage;
use db::rbac::Permission;

#[derive(Debug, MultipartForm)]
pub struct UploadForm {
    pub file: TempFile,
}

#[derive(Serialize, ToSchema)]
pub struct UploadResponse {
    pub key: String,
    pub url: String,
    pub file_name: String,
    pub size: usize,
}

#[utoipa::path(
    post,
    path = "/api/uploads",
    request_body(content = String, description = "multipart/form-data with `file` field", content_type = "multipart/form-data"),
    responses(
        (status = 200, description = "File uploaded", body = UploadResponse),
        (status = 403, description = "Insufficient permissions", body = crate::error::ErrorResponse),
        (status = 500, description = "Upload failed", body = crate::error::ErrorResponse),
    ),
    security(
        ("bearer_auth" = [])
    ),
)]
pub async fn upload_file(
    storage: web::Data<Storage>,
    auth: AuthenticatedUser,
    MultipartForm(form): MultipartForm<UploadForm>,
) -> Result<HttpResponse, ApiError> {
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

    Ok(HttpResponse::Ok().json(UploadResponse {
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
