pub mod common;
pub mod g1;
pub mod student;
pub mod user;

// Common domain
pub use common::addresses;
pub use common::addresses_audit;
pub use common::audit_logs;
pub use common::blacklist;
pub use common::counter;
pub use common::districts;
pub use common::enrollment_batches;
pub use common::enums;
pub use common::guardians;
pub use common::guardians_audit;
pub use common::past_pupil_details;
pub use common::schools;
pub use common::secure_counter;
pub use common::siblings;
pub use common::staff_details;
pub use common::workspace_addresses;
// Backward-compatible re-exports for auth
pub use user::Column as UserColumn;
pub use user::Entity as UserEntity;
pub use user::Model as UserModel;
pub use user::session;

// Student domain (accessible via pub mod student)

// G1 admission domain
pub use g1::admission_lists;
pub use g1::appeal_history;
pub use g1::applications;
pub use g1::audit;
pub use g1::children;
pub use g1::documents;
pub use g1::documents_audit;
pub use g1::join_addresses;
pub use g1::join_guardians;
pub use g1::join_siblings;
pub use g1::join_workspace_addresses;
pub use g1::marks_breakdown;
