use db::domain::blacklist::*;

fn make_blacklist_model() -> db::entity::common::blacklist::Model {
    db::entity::common::blacklist::Model {
        id: uuid::Uuid::new_v4(),
        guardian_id: uuid::Uuid::new_v4(),
        application_id: None,
        reason: "Fraudulent application".to_string(),
        evidence_url: None,
        blacklisted_at: chrono::Utc::now(),
        expires_at: chrono::Utc::now() + chrono::Duration::days(365),
        blacklisted_by: None,
        status: "Active".to_string(),
    }
}

#[test]
fn test_blacklist_from_model() {
    let model = make_blacklist_model();
    let entry = BlacklistEntry::<Active>::from_model(model.clone());
    assert_eq!(entry.inner().id, model.id);
}

#[test]
fn test_blacklist_expire() {
    let model = make_blacklist_model();
    let entry = BlacklistEntry::<Active>::from_model(model);
    let expired = entry.expire().unwrap();
    assert_eq!(expired.model().status, "Expired");
}

#[test]
fn test_blacklist_from_trait() {
    let model = make_blacklist_model();
    let id = model.id;
    let entry: BlacklistEntry<Active> = model.into();
    assert_eq!(entry.inner().id, id);
}
