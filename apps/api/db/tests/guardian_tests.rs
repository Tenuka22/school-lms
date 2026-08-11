use db::domain::guardian::*;
use db::entity::common::enums::{GuardianRelationship, IncomeLevel};

fn make_guardian_model() -> db::entity::common::guardians::Model {
    db::entity::common::guardians::Model {
        id: uuid::Uuid::new_v4(),
        relationship_type: GuardianRelationship::Father,
        full_name: "Test Father".to_string(),
        nic_number: "920000000V".to_string(),
        contact_phone: "+94770000000".to_string(),
        contact_email: Some("test@example.com".to_string()),
        occupation: Some("Engineer".to_string()),
        workplace_name: Some("TechCorp".to_string()),
        workplace_address: None,
        is_govt_employee: false,
        govt_service_years: None,
        is_school_staff: false,
        is_past_pupil: true,
        past_pupil_verified: false,
        income_level: Some(IncomeLevel::Between50000And100000),
        address_id: None,
        is_sri_lankan_citizen: Some(true),
        student_id: None,
        created_at: chrono::Utc::now(),
    }
}

#[test]
fn test_guardian_from_model() {
    let model = make_guardian_model();
    let guardian = Guardian::<Unverified>::from_model(model.clone());
    assert_eq!(guardian.inner().id, model.id);
}

#[test]
fn test_guardian_verify() {
    let model = make_guardian_model();
    let guardian = Guardian::<Unverified>::from_model(model);
    let verified = guardian.verify().unwrap();
    assert!(verified.model().past_pupil_verified);
}

#[test]
fn test_guardian_helpers() {
    let model = make_guardian_model();
    let guardian = Guardian::<Unverified>::from_model(model);
    assert!(!guardian.is_govt_employee());
    assert!(!guardian.is_school_staff());
    assert!(guardian.is_past_pupil());
}

#[test]
fn test_guardian_from_trait() {
    let model = make_guardian_model();
    let id = model.id;
    let guardian: Guardian<Unverified> = model.into();
    assert_eq!(guardian.inner().id, id);
}

#[test]
fn test_guardian_into_inner() {
    let model = make_guardian_model();
    let id = model.id;
    let guardian = Guardian::<Unverified>::from_model(model);
    let inner = guardian.into_inner();
    assert_eq!(inner.id, id);
}
