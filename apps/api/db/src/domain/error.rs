use std::fmt;

#[derive(Debug, Clone)]
pub enum TransitionError {
    InvalidTransition {
        from: &'static str,
        to: &'static str,
    },
    MissingField(&'static str),
    BusinessRule(String),
}

impl fmt::Display for TransitionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidTransition { from, to } => {
                write!(f, "Cannot transition from {} to {}", from, to)
            }
            Self::MissingField(field) => write!(f, "Missing required field: {}", field),
            Self::BusinessRule(msg) => write!(f, "Business rule violation: {}", msg),
        }
    }
}

impl std::error::Error for TransitionError {}
