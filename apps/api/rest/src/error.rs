use std::collections::BTreeMap;
use std::fmt;

use actix_web::{HttpResponse, http::StatusCode};
use apistos::{ApiComponent, ApiErrorComponent};
use apistos::paths::{MediaType, Response};
use apistos::reference_or::ReferenceOr;
use apistos::Schema;
use schemars::JsonSchema;
use serde::Serialize;

#[derive(Debug, Serialize, JsonSchema, ApiComponent)]
pub struct ErrorResponse {
    pub error: String,
}

#[derive(Debug)]
pub enum ApiError {
    BadRequest(String),
    Unauthorized(String),
    Forbidden(String),
    NotFound(String),
    Conflict(String),
    /// 409 with duplicate child records for the frontend to display
    ConflictWithDuplicates(Vec<crate::students::handlers::create_student::DuplicateChild>),
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
            ApiError::ConflictWithDuplicates(dups) => {
                write!(f, "found {} duplicate child(ren)", dups.len())
            }
            ApiError::Internal(msg) => f.write_str(msg),
        }
    }
}

impl From<db::domain::error::TransitionError> for ApiError {
    fn from(e: db::domain::error::TransitionError) -> Self {
        ApiError::BadRequest(e.to_string())
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
            ApiError::Conflict(_) | ApiError::ConflictWithDuplicates(_) => StatusCode::CONFLICT,
            ApiError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
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
            content: BTreeMap::from_iter(vec![("application/json".to_string(), error_media_type())]),
            ..Default::default()
        },
    )
}

impl ApiErrorComponent for ApiError {
    fn schemas_by_status_code() -> BTreeMap<String, (String, ReferenceOr<Schema>)> {
        BTreeMap::from_iter(vec![
            ("400".to_string(), ("ErrorResponse".to_string(), ReferenceOr::Reference { _ref: ERROR_SCHEMA_REF.to_string() })),
            ("401".to_string(), ("ErrorResponse".to_string(), ReferenceOr::Reference { _ref: ERROR_SCHEMA_REF.to_string() })),
            ("403".to_string(), ("ErrorResponse".to_string(), ReferenceOr::Reference { _ref: ERROR_SCHEMA_REF.to_string() })),
            ("404".to_string(), ("ErrorResponse".to_string(), ReferenceOr::Reference { _ref: ERROR_SCHEMA_REF.to_string() })),
            ("409".to_string(), ("ErrorResponse".to_string(), ReferenceOr::Reference { _ref: ERROR_SCHEMA_REF.to_string() })),
            ("500".to_string(), ("ErrorResponse".to_string(), ReferenceOr::Reference { _ref: ERROR_SCHEMA_REF.to_string() })),
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
