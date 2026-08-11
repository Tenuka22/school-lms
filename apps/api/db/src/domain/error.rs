use std::fmt;

#[derive(Debug, Clone)]
pub enum TransitionError {
    InvalidTransition {
        from: &'static str,
        to: &'static str,
    },
    MissingField(&'static str),
    BusinessRule(String),
    EntityLocked {
        entity: String,
        id: uuid::Uuid,
        status: String,
    },
}

impl fmt::Display for TransitionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidTransition { from, to } => {
                write!(f, "Cannot transition from {} to {}", from, to)
            }
            Self::MissingField(field) => write!(f, "Missing required field: {}", field),
            Self::BusinessRule(msg) => write!(f, "Business rule violation: {}", msg),
            Self::EntityLocked { entity, id, status } => {
                write!(
                    f,
                    "Entity {} ({}) is locked in status '{}'. Pass force=true to override",
                    entity, id, status
                )
            }
        }
    }
}

impl std::error::Error for TransitionError {}

/// Unified application error type — single source of truth for all error variants.
#[derive(Debug, Clone)]
pub enum AppError {
    BadRequest(String),
    Unauthorized(String),
    Forbidden(String),
    NotFound(String),
    Conflict(String),
    Internal(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::BadRequest(msg) => f.write_str(msg),
            Self::Unauthorized(msg) => f.write_str(msg),
            Self::Forbidden(msg) => f.write_str(msg),
            Self::NotFound(msg) => f.write_str(msg),
            Self::Conflict(msg) => f.write_str(msg),
            Self::Internal(msg) => f.write_str(msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<TransitionError> for AppError {
    fn from(e: TransitionError) -> Self {
        AppError::BadRequest(e.to_string())
    }
}

impl From<sea_orm::DbErr> for AppError {
    fn from(e: sea_orm::DbErr) -> Self {
        log::error!("Database error: {e}");
        AppError::Internal("internal error".into())
    }
}
