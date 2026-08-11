use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Role {
    Admin,
    OfficeStaff,
    Unknown,
    Unauthenticated,
}

impl fmt::Display for Role {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Role::Admin => write!(f, "admin"),
            Role::OfficeStaff => write!(f, "office_staff"),
            Role::Unknown => write!(f, "unknown"),
            Role::Unauthenticated => write!(f, "unauthenticated"),
        }
    }
}

impl From<&str> for Role {
    fn from(s: &str) -> Self {
        match s {
            "admin" => Role::Admin,
            "office_staff" => Role::OfficeStaff,
            "unknown" => Role::Unknown,
            "unauthenticated" => Role::Unauthenticated,
            _ => Role::Unknown,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)]
pub enum Permission {
    ProfileRead,
    ProfileUpdate,
    CounterRead,
    CounterIncrement,
    CounterSecureRead,
    CounterSecureIncrement,
    CourseList,
    AnnouncementRead,
    FileUpload,
    G1ApplicationCreate,
    G1ApplicationRead,
    G1ApplicationUpdate,
    G1ApplicationDelete,
    G1ApplicationSubmit,
    G1ApplicationVerify,

    G1DocumentUpload,
    G1DocumentVerify,
    G1AppealCreate,
    G1AppealReview,
    G1ReportRead,
    EnrollmentBatchCreate,
    EnrollmentBatchRead,
    EnrollmentBatchUpdate,
    EnrollmentBatchDelete,
    All,
}

impl Permission {
    pub fn as_str(&self) -> &'static str {
        match self {
            Permission::ProfileRead => "profile:read",
            Permission::ProfileUpdate => "profile:update",
            Permission::CounterRead => "counter:read",
            Permission::CounterIncrement => "counter:increment",
            Permission::CounterSecureRead => "counter:secure:read",
            Permission::CounterSecureIncrement => "counter:secure:increment",
            Permission::CourseList => "course:list",
            Permission::AnnouncementRead => "announcement:read",
            Permission::FileUpload => "file:upload",
            Permission::G1ApplicationCreate => "g1:application:create",
            Permission::G1ApplicationRead => "g1:application:read",
            Permission::G1ApplicationUpdate => "g1:application:update",
            Permission::G1ApplicationDelete => "g1:application:delete",
            Permission::G1ApplicationSubmit => "g1:application:submit",
            Permission::G1ApplicationVerify => "g1:application:verify",

            Permission::G1DocumentUpload => "g1:document:upload",
            Permission::G1DocumentVerify => "g1:document:verify",
            Permission::G1AppealCreate => "g1:appeal:create",
            Permission::G1AppealReview => "g1:appeal:review",
            Permission::G1ReportRead => "g1:report:read",
            Permission::EnrollmentBatchCreate => "enrollment-batch:create",
            Permission::EnrollmentBatchRead => "enrollment-batch:read",
            Permission::EnrollmentBatchUpdate => "enrollment-batch:update",
            Permission::EnrollmentBatchDelete => "enrollment-batch:delete",
            Permission::All => "*:*",
        }
    }
}

impl fmt::Display for Permission {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

pub const ADMIN_EMAIL: &str = "tenukaomaljith2009@gmail.com";
