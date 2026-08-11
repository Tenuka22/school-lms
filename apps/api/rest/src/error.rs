use std::collections::BTreeMap;
use std::fmt;

use actix_web::{HttpResponse, http::StatusCode};
use apistos::Schema;
use apistos::paths::{MediaType, Response};
use apistos::reference_or::ReferenceOr;
use apistos::{ApiComponent, ApiErrorComponent};
use schemars::JsonSchema;
use serde::Serialize;

pub use db::domain::error::AppError;

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct ErrorResponse {
    pub error: String,
}

/// HTTP-level error — wraps [`AppError`] and adds variants that need actix-web / apistos.
#[derive(Debug)]
pub enum ApiError {
    App(AppError),
    /// 409 with duplicate child records for the frontend to display
    ConflictWithDuplicates(Vec<crate::students::handlers::create_student::DuplicateChild>),
}

impl ApiError {
    pub fn bad_request(msg: impl Into<String>) -> Self {
        ApiError::App(AppError::BadRequest(msg.into()))
    }
    pub fn unauthorized(msg: impl Into<String>) -> Self {
        ApiError::App(AppError::Unauthorized(msg.into()))
    }
    pub fn forbidden(msg: impl Into<String>) -> Self {
        ApiError::App(AppError::Forbidden(msg.into()))
    }
    pub fn not_found(msg: impl Into<String>) -> Self {
        ApiError::App(AppError::NotFound(msg.into()))
    }
    pub fn conflict(msg: impl Into<String>) -> Self {
        ApiError::App(AppError::Conflict(msg.into()))
    }
    pub fn internal(msg: impl Into<String>) -> Self {
        ApiError::App(AppError::Internal(msg.into()))
    }
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ApiError::App(e) => write!(f, "{e}"),
            ApiError::ConflictWithDuplicates(dups) => {
                write!(f, "found {} duplicate child(ren)", dups.len())
            }
        }
    }
}

impl From<AppError> for ApiError {
    fn from(e: AppError) -> Self {
        ApiError::App(e)
    }
}

impl From<db::domain::error::TransitionError> for ApiError {
    fn from(e: db::domain::error::TransitionError) -> Self {
        ApiError::App(AppError::from(e))
    }
}

impl From<sea_orm::DbErr> for ApiError {
    fn from(e: sea_orm::DbErr) -> Self {
        ApiError::App(AppError::from(e))
    }
}

impl actix_web::ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        match self {
            ApiError::App(e) => match e {
                AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
                AppError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
                AppError::Forbidden(_) => StatusCode::FORBIDDEN,
                AppError::NotFound(_) => StatusCode::NOT_FOUND,
                AppError::Conflict(_) => StatusCode::CONFLICT,
                AppError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
            },
            ApiError::ConflictWithDuplicates(_) => StatusCode::CONFLICT,
        }
    }

    fn error_response(&self) -> HttpResponse {
        match self {
            ApiError::ConflictWithDuplicates(dups) => {
                HttpResponse::build(self.status_code()).json(serde_json::json!({
                    "error": self.to_string(),
                    "duplicates": dups,
                }))
            }
            _ => HttpResponse::build(self.status_code()).json(ErrorResponse {
                error: self.to_string(),
            }),
        }
    }
}

const ERROR_SCHEMA_REF: &str = "#/components/schemas/ErrorResponse";

fn error_media_type() -> MediaType {
    MediaType {
        schema: Some(ReferenceOr::Reference {
            _ref: ERROR_SCHEMA_REF.to_string(),
        }),
        ..Default::default()
    }
}

fn error_response(code: u16, description: &str) -> (String, Response) {
    (
        code.to_string(),
        Response {
            description: description.to_string(),
            content: BTreeMap::from_iter(vec![(
                "application/json".to_string(),
                error_media_type(),
            )]),
            ..Default::default()
        },
    )
}

impl ApiErrorComponent for ApiError {
    fn schemas_by_status_code() -> BTreeMap<String, (String, ReferenceOr<Schema>)> {
        BTreeMap::from_iter(vec![
            (
                "400".to_string(),
                (
                    "ErrorResponse".to_string(),
                    ReferenceOr::Reference {
                        _ref: ERROR_SCHEMA_REF.to_string(),
                    },
                ),
            ),
            (
                "401".to_string(),
                (
                    "ErrorResponse".to_string(),
                    ReferenceOr::Reference {
                        _ref: ERROR_SCHEMA_REF.to_string(),
                    },
                ),
            ),
            (
                "403".to_string(),
                (
                    "ErrorResponse".to_string(),
                    ReferenceOr::Reference {
                        _ref: ERROR_SCHEMA_REF.to_string(),
                    },
                ),
            ),
            (
                "404".to_string(),
                (
                    "ErrorResponse".to_string(),
                    ReferenceOr::Reference {
                        _ref: ERROR_SCHEMA_REF.to_string(),
                    },
                ),
            ),
            (
                "409".to_string(),
                (
                    "ErrorResponse".to_string(),
                    ReferenceOr::Reference {
                        _ref: ERROR_SCHEMA_REF.to_string(),
                    },
                ),
            ),
            (
                "500".to_string(),
                (
                    "ErrorResponse".to_string(),
                    ReferenceOr::Reference {
                        _ref: ERROR_SCHEMA_REF.to_string(),
                    },
                ),
            ),
        ])
    }

    fn error_responses() -> Vec<(String, Response)> {
        vec![
            error_response(400, "Bad Request"),
            error_response(401, "Unauthorized"),
            error_response(403, "Forbidden"),
            error_response(404, "Not Found"),
            error_response(409, "Conflict"),
            error_response(500, "Internal Server Error"),
        ]
    }
}
