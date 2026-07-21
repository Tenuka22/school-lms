use std::fmt;

use actix_web::{HttpResponse, http::StatusCode};
use apistos::ApiErrorComponent;
use schemars::JsonSchema;
use serde::Serialize;

#[derive(Debug, Serialize, JsonSchema)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Debug, ApiErrorComponent)]
#[openapi_error(
    status(code = 400),
    status(code = 401),
    status(code = 403),
    status(code = 404),
    status(code = 409),
    status(code = 500)
)]
pub enum ApiError {
    BadRequest(String),
    Unauthorized(String),
    Forbidden(String),
    NotFound(String),
    Conflict(String),
    Internal(String),
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ApiError::BadRequest(msg) => f.write_str(msg),
            ApiError::Unauthorized(msg) => f.write_str(msg),
            ApiError::Forbidden(msg) => f.write_str(msg),
            ApiError::NotFound(msg) => f.write_str(msg),
            ApiError::Conflict(msg) => f.write_str(msg),
            ApiError::Internal(msg) => f.write_str(msg),
        }
    }
}

impl From<sea_orm::DbErr> for ApiError {
    fn from(e: sea_orm::DbErr) -> Self {
        log::error!("Database error: {e}");
        ApiError::Internal("internal error".into())
    }
}

impl actix_web::ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        match self {
            ApiError::BadRequest(_) => StatusCode::BAD_REQUEST,
            ApiError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            ApiError::Forbidden(_) => StatusCode::FORBIDDEN,
            ApiError::NotFound(_) => StatusCode::NOT_FOUND,
            ApiError::Conflict(_) => StatusCode::CONFLICT,
            ApiError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code()).json(ErrorResponse {
            error: self.to_string(),
        })
    }
}
