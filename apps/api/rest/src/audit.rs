use chrono::Utc;
use db::entity::common::enums::AuditOperation;
use sea_orm::{ActiveModelTrait, DatabaseConnection, Set};
use uuid::Uuid;

use crate::auth::middleware::AuthenticatedUser;

/// Compute which fields changed between old and new JSON values.
pub fn changed_fields(
    old: &Option<serde_json::Value>,
    new: &Option<serde_json::Value>,
) -> Option<Vec<String>> {
    let old_map = match old {
        Some(serde_json::Value::Object(m)) => m,
        _ => return None,
    };
    let new_map = match new {
        Some(serde_json::Value::Object(m)) => m,
        _ => return None,
    };
    let mut changed = Vec::new();
    for (key, new_val) in new_map {
        if let Some(old_val) = old_map.get(key) {
            if old_val != new_val {
                changed.push(key.clone());
            }
        } else {
            changed.push(key.clone());
        }
    }
    if changed.is_empty() {
        None
    } else {
        Some(changed)
    }
}

/// Serialize a model to JSON for audit logging.
pub fn to_json<T: serde::Serialize>(model: &T) -> Option<serde_json::Value> {
    serde_json::to_value(model).ok()
}

// ── Children audit ──────────────────────────────────────────────────

pub async fn log_child_change(
    db: &DatabaseConnection,
    child_id: Uuid,
    operation: AuditOperation,
    old: Option<serde_json::Value>,
    new: Option<serde_json::Value>,
    auth: &AuthenticatedUser,
    context: Option<String>,
) {
    let _changed = changed_fields(&old, &new);
    let _ = db::entity::audit_logs::ActiveModel {
        id: Set(Uuid::new_v4()),
        table_name: Set("children".to_string()),
        record_id: Set(child_id),
        action: Set(match operation {
            AuditOperation::Insert => db::entity::common::enums::AuditAction::Insert,
            AuditOperation::Update => db::entity::common::enums::AuditAction::Update,
            AuditOperation::Delete => db::entity::common::enums::AuditAction::Delete,
            _ => db::entity::common::enums::AuditAction::Update,
        }),
        old_values: Set(old),
        new_values: Set(new),
        performed_by: Set(auth.user_id),
        performed_at: Set(Utc::now()),
        ip_address: Set(None),
        reason: Set(context),
    }
    .insert(db)
    .await;
}

// ── Guardians audit ─────────────────────────────────────────────────

pub async fn log_guardian_change(
    db: &DatabaseConnection,
    guardian_id: Uuid,
    operation: AuditOperation,
    old: Option<serde_json::Value>,
    new: Option<serde_json::Value>,
    auth: &AuthenticatedUser,
    context: Option<String>,
) {
    let changed = changed_fields(&old, &new);
    let _ = db::entity::guardians_audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        guardian_id: Set(Some(guardian_id)),
        operation: Set(operation),
        changed_fields: Set(changed.map(|f| serde_json::to_value(&f).ok()).flatten()),
        old_values: Set(old),
        new_values: Set(new),
        changed_by: Set(auth.user_id),
        changed_at: Set(Utc::now()),
        context: Set(context),
    }
    .insert(db)
    .await;
}

// ── G1 Applications audit ───────────────────────────────────────────

pub async fn log_application_change(
    db: &DatabaseConnection,
    application_id: Uuid,
    operation: AuditOperation,
    old: Option<serde_json::Value>,
    new: Option<serde_json::Value>,
    auth: &AuthenticatedUser,
    context: Option<String>,
) {
    let changed = changed_fields(&old, &new);
    let _ = db::entity::g1::audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        application_id: Set(Some(application_id)),
        operation: Set(operation),
        changed_fields: Set(changed.map(|f| serde_json::to_value(&f).ok()).flatten()),
        old_values: Set(old),
        new_values: Set(new),
        changed_by: Set(auth.user_id),
        changed_at: Set(Utc::now()),
        context: Set(context),
    }
    .insert(db)
    .await;
}

// ── Documents audit ─────────────────────────────────────────────────

pub async fn log_document_change(
    db: &DatabaseConnection,
    document_id: Uuid,
    operation: AuditOperation,
    old: Option<serde_json::Value>,
    new: Option<serde_json::Value>,
    auth: &AuthenticatedUser,
    context: Option<String>,
) {
    let changed = changed_fields(&old, &new);
    let _ = db::entity::g1::documents_audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        document_id: Set(Some(document_id)),
        operation: Set(operation),
        changed_fields: Set(changed.map(|f| serde_json::to_value(&f).ok()).flatten()),
        old_values: Set(old),
        new_values: Set(new),
        changed_by: Set(auth.user_id),
        changed_at: Set(Utc::now()),
        context: Set(context),
    }
    .insert(db)
    .await;
}

// ── Students audit ──────────────────────────────────────────────────

pub async fn log_student_change(
    db: &DatabaseConnection,
    student_id: Uuid,
    operation: AuditOperation,
    old: Option<serde_json::Value>,
    new: Option<serde_json::Value>,
    auth: &AuthenticatedUser,
    context: Option<String>,
) {
    let changed = changed_fields(&old, &new);
    let _ = db::entity::student::audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        student_id: Set(Some(student_id)),
        operation: Set(operation),
        changed_fields: Set(changed.map(|f| serde_json::to_value(&f).ok()).flatten()),
        old_values: Set(old),
        new_values: Set(new),
        changed_by: Set(auth.user_id),
        changed_at: Set(Utc::now()),
        context: Set(context),
    }
    .insert(db)
    .await;
}

// ── Addresses audit ─────────────────────────────────────────────────

pub async fn log_address_change(
    db: &DatabaseConnection,
    address_id: Uuid,
    operation: AuditOperation,
    old: Option<serde_json::Value>,
    new: Option<serde_json::Value>,
    auth: &AuthenticatedUser,
    context: Option<String>,
) {
    let changed = changed_fields(&old, &new);
    let _ = db::entity::addresses_audit::ActiveModel {
        id: Set(Uuid::new_v4()),
        address_id: Set(Some(address_id)),
        operation: Set(operation),
        changed_fields: Set(changed.map(|f| serde_json::to_value(&f).ok()).flatten()),
        old_values: Set(old),
        new_values: Set(new),
        changed_by: Set(auth.user_id),
        changed_at: Set(Utc::now()),
        context: Set(context),
    }
    .insert(db)
    .await;
}
