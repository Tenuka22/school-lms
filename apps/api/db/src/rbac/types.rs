use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Role {
    Admin,
    Unknown,
    Unauthenticated,
}

impl fmt::Display for Role {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Role::Admin => write!(f, "admin"),
            Role::Unknown => write!(f, "unknown"),
            Role::Unauthenticated => write!(f, "unauthenticated"),
        }
    }
}

impl From<&str> for Role {
    fn from(s: &str) -> Self {
        match s {
            "admin" => Role::Admin,
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
