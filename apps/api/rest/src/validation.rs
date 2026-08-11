use crate::error::ApiError;

// ─── String newtypes ───

pub struct Email(String);
pub struct Phone(String);
pub struct FullName(String);
pub struct NameWithInitials(String);
pub struct NicNumber(String);
pub struct NonEmpty(String);
pub struct PostalCode(String);
pub struct SearchQuery(String);
pub struct Url(String);
pub struct AddressLine(String);

// ─── Numeric newtypes ───

pub struct Latitude(pub f64);
pub struct Longitude(pub f64);
pub struct DistanceKm(pub f64);
pub struct Year(pub i16);
pub struct Percentage(pub i16);
pub struct WizardStep(pub i16);
pub struct CurrentGrade(pub i16);
pub struct FileSize(pub i64);

// ─── Implementations ───

impl Email {
    pub fn new(value: String) -> Result<Self, ApiError> {
        if value.trim().is_empty() {
            return Err(ApiError::BadRequest("email is required".into()));
        }
        if !value.contains('@') || !value.contains('.') {
            return Err(ApiError::BadRequest("invalid email format".into()));
        }
        let parts: Vec<&str> = value.split('@').collect();
        if parts.len() != 2 || parts[0].is_empty() || parts[1].is_empty() {
            return Err(ApiError::BadRequest("invalid email format".into()));
        }
        Ok(Self(value))
    }
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl Phone {
    /// Validates and normalizes a Sri Lankan phone number to +94 format.
    /// Accepts: +94XXXXXXXXX, 07XXXXXXXX, 7XXXXXXXX, 94XXXXXXXXX
    /// Returns: +94XXXXXXXXX (always normalized)
    pub fn new(value: String) -> Result<Self, ApiError> {
        if value.trim().is_empty() {
            return Err(ApiError::BadRequest("phone number is required".into()));
        }
        let cleaned: String = value.chars().filter(|c| c.is_ascii_digit()).collect();

        let normalized = if cleaned.starts_with("94") && cleaned.len() == 11 {
            // 94XXXXXXXXX (country code without +)
            format!("+{}", cleaned)
        } else if cleaned.starts_with("0") && cleaned.len() == 10 {
            // 07XXXXXXXX or 0XX XXXXXXX
            format!("+94{}", &cleaned[1..])
        } else if cleaned.len() == 9 {
            // 7XXXXXXXX (9-digit mobile without prefix)
            format!("+94{}", cleaned)
        } else if cleaned.starts_with("94") && cleaned.len() == 12 {
            // 0094XXXXXXXXX (international prefix)
            format!("+{}", &cleaned[2..])
        } else {
            return Err(ApiError::BadRequest(
                "invalid Sri Lankan phone number".into(),
            ));
        };

        let digits_after_94: usize = normalized[3..]
            .chars()
            .filter(|c| c.is_ascii_digit())
            .count();
        if digits_after_94 != 9 {
            return Err(ApiError::BadRequest(
                "Sri Lankan phone number must have 9 digits after +94".into(),
            ));
        }

        Ok(Self(normalized))
    }
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl FullName {
    pub fn new(value: String) -> Result<Self, ApiError> {
        if value.trim().is_empty() {
            return Err(ApiError::BadRequest("full name is required".into()));
        }
        if value.split_whitespace().count() < 2 {
            return Err(ApiError::BadRequest(
                "full name must include at least a first name and a last name".into(),
            ));
        }
        Ok(Self(value))
    }
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl NameWithInitials {
    pub fn new(value: String) -> Result<Self, ApiError> {
        if value.trim().is_empty() {
            return Err(ApiError::BadRequest(
                "name with initials is required".into(),
            ));
        }
        let has_initial = value
            .split_whitespace()
            .any(|part| part.chars().any(|c| c.is_uppercase()));
        if !has_initial {
            return Err(ApiError::BadRequest(
                "name must include at least one initial".into(),
            ));
        }
        Ok(Self(value))
    }
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl NicNumber {
    pub fn new(value: String) -> Result<Self, ApiError> {
        if value.trim().is_empty() {
            return Err(ApiError::BadRequest("NIC number is required".into()));
        }
        let is_old_format = value.len() == 10
            && value.chars().take(9).all(|c| c.is_ascii_digit())
            && value
                .chars()
                .last()
                .is_some_and(|c| c == 'V' || c == 'X' || c == 'v' || c == 'x');
        let is_new_format = value.len() == 12 && value.chars().all(|c| c.is_ascii_digit());
        if !is_old_format && !is_new_format {
            return Err(ApiError::BadRequest(
                "NIC must be 9 digits + V/X or 12 digits".into(),
            ));
        }
        Ok(Self(value))
    }
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl NonEmpty {
    pub fn new(value: String, field: &str) -> Result<Self, ApiError> {
        if value.trim().is_empty() {
            return Err(ApiError::BadRequest(format!("{field} is required")));
        }
        Ok(Self(value))
    }
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl PostalCode {
    pub fn new(value: String) -> Result<Self, ApiError> {
        if value.trim().is_empty() {
            return Err(ApiError::BadRequest("postal code is required".into()));
        }
        let cleaned: String = value.chars().filter(|c| c.is_alphanumeric()).collect();
        if cleaned.len() < 3 || cleaned.len() > 10 {
            return Err(ApiError::BadRequest("invalid postal code".into()));
        }
        Ok(Self(value))
    }
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl SearchQuery {
    pub fn new(value: String) -> Result<Self, ApiError> {
        if value.trim().is_empty() {
            return Err(ApiError::BadRequest("search query is required".into()));
        }
        if value.len() > 200 {
            return Err(ApiError::BadRequest("search query too long".into()));
        }
        Ok(Self(value))
    }
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl Url {
    pub fn new(value: String) -> Result<Self, ApiError> {
        if value.trim().is_empty() {
            return Err(ApiError::BadRequest("URL is required".into()));
        }
        if !value.starts_with("http://") && !value.starts_with("https://") {
            return Err(ApiError::BadRequest("invalid URL format".into()));
        }
        Ok(Self(value))
    }
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl AddressLine {
    pub fn new(value: String, field: &str) -> Result<Self, ApiError> {
        if value.trim().is_empty() {
            return Err(ApiError::BadRequest(format!("{field} is required")));
        }
        if value.len() > 255 {
            return Err(ApiError::BadRequest(format!("{field} is too long")));
        }
        Ok(Self(value))
    }
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl Latitude {
    pub fn new(value: f64) -> Result<Self, ApiError> {
        if !(-90.0..=90.0).contains(&value) {
            return Err(ApiError::BadRequest(
                "latitude must be between -90 and 90".into(),
            ));
        }
        Ok(Self(value))
    }
}

impl Longitude {
    pub fn new(value: f64) -> Result<Self, ApiError> {
        if !(-180.0..=180.0).contains(&value) {
            return Err(ApiError::BadRequest(
                "longitude must be between -180 and 180".into(),
            ));
        }
        Ok(Self(value))
    }
}

impl DistanceKm {
    pub fn new(value: f64) -> Result<Self, ApiError> {
        if value < 0.0 {
            return Err(ApiError::BadRequest("distance must be non-negative".into()));
        }
        Ok(Self(value))
    }
}

impl Year {
    pub fn new(value: i16) -> Result<Self, ApiError> {
        if !(1900..=2100).contains(&value) {
            return Err(ApiError::BadRequest(
                "year must be between 1900 and 2100".into(),
            ));
        }
        Ok(Self(value))
    }
}

impl Percentage {
    pub fn new(value: i16) -> Result<Self, ApiError> {
        if !(0..=100).contains(&value) {
            return Err(ApiError::BadRequest(
                "percentage must be between 0 and 100".into(),
            ));
        }
        Ok(Self(value))
    }
    pub fn sum(values: &[i16]) -> Result<(), ApiError> {
        let total: i16 = values.iter().sum();
        if total != 100 {
            return Err(ApiError::BadRequest(format!(
                "percentages must add up to 100, got {total}"
            )));
        }
        Ok(())
    }
}

impl WizardStep {
    pub fn new(value: i16) -> Result<Self, ApiError> {
        if !(1..=7).contains(&value) {
            return Err(ApiError::BadRequest(
                "wizard step must be between 1 and 7".into(),
            ));
        }
        Ok(Self(value))
    }
}

impl CurrentGrade {
    pub fn new(value: i16) -> Result<Self, ApiError> {
        if !(1..=13).contains(&value) {
            return Err(ApiError::BadRequest(
                "grade must be between 1 and 13".into(),
            ));
        }
        Ok(Self(value))
    }
}

impl FileSize {
    pub fn new(value: i64, max_bytes: i64) -> Result<Self, ApiError> {
        if value <= 0 {
            return Err(ApiError::BadRequest("file_size must be positive".into()));
        }
        if value > max_bytes {
            return Err(ApiError::BadRequest(format!(
                "file exceeds {}MB limit",
                max_bytes / (1024 * 1024)
            )));
        }
        Ok(Self(value))
    }
}
