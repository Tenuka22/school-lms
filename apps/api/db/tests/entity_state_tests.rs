use db::entity_state::g1_application::*;
use db::entity::common::enums::EnrollmentStatus;
use db::domain::error::TransitionError;

fn make_model(status: EnrollmentStatus) -> db::entity::g1::applications::Model {
    db::entity::g1::applications::Model {
        id: uuid::Uuid::new_v4(),
        reference_no: "TEST-001".to_string(),
        school_id: None,
        total_marks: None,
        rank_number: None,
        list_category: None,
        submitted_at: None,
        verified_at: None,
        verified_by: None,
        finalized_at: None,
        ip_address: None,
        user_agent: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        child_id: uuid::Uuid::new_v4(),
        guardian_id: uuid::Uuid::nil(),
        batch_id: uuid::Uuid::new_v4(),
        enrollment_status: status,
        category: None,
        overseas_arrival_date: None,
        submission_method: None,
        interview_date: None,
        interview_completed: false,
        birth_certificate_verified: false,
        age_eligibility_verified: false,
        residence_verified: false,
        category_verified: false,
        alternative_age_certificate: false,
        alternative_age_certificate_ref: None,
        rejection_reason: None,
        created_by: None,
        updated_by: None,
        wizard_step: Some(1),
        deleted_at: None,
        preferred_school_ids: None,
        electoral_year: None,
        polling_district: None,
        polling_division: None,
        gn_name: None,
        gn_number: None,
        polling_area: None,
        village_street: None,
        voter_names: None,
        household_head_name: None,
        declaration_agreed: false,
        declaration_signed_at: None,
        closer_school_exists: None,
    }
}

#[test]
fn test_active_from_model() {
    let model = make_model(EnrollmentStatus::Draft);
    let entity = G1ApplicationEntity::<Active>::from_model(model.clone());
    assert_eq!(entity.inner().id, model.id);
}

#[test]
fn test_lock_if_needed_draft_stays_active() {
    let entity = G1ApplicationEntity::<Active>::from_model(make_model(EnrollmentStatus::Draft));
    let result = entity.lock_if_needed();
    assert!(result.is_ok());
}

#[test]
fn test_lock_if_needed_pending_stays_active() {
    let entity =
        G1ApplicationEntity::<Active>::from_model(make_model(EnrollmentStatus::Pending));
    let result = entity.lock_if_needed();
    assert!(result.is_ok());
}

#[test]
fn test_lock_if_needed_completed_stays_active() {
    let entity =
        G1ApplicationEntity::<Active>::from_model(make_model(EnrollmentStatus::Completed));
    let result = entity.lock_if_needed();
    assert!(result.is_ok());
}

#[test]
fn test_lock_if_needed_approved_locks() {
    let entity =
        G1ApplicationEntity::<Active>::from_model(make_model(EnrollmentStatus::Approved));
    let result = entity.lock_if_needed();
    assert!(result.is_err());
    match result.unwrap_err() {
        TransitionError::EntityLocked { entity, status, .. } => {
            assert_eq!(entity, "G1Application");
            assert_eq!(status, "Approved");
        }
        _ => panic!("expected EntityLocked"),
    }
}

#[test]
fn test_lock_if_needed_admitted_locks() {
    let entity =
        G1ApplicationEntity::<Active>::from_model(make_model(EnrollmentStatus::Admitted));
    let result = entity.lock_if_needed();
    assert!(result.is_err());
}

#[test]
fn test_force_lock() {
    let entity =
        G1ApplicationEntity::<Active>::from_model(make_model(EnrollmentStatus::Approved));
    let locked = entity.force_lock();
    assert!(!locked.can_mutate(false));
    assert!(locked.can_mutate(true));
}

#[test]
fn test_unlock_with_force() {
    let entity =
        G1ApplicationEntity::<Active>::from_model(make_model(EnrollmentStatus::Approved));
    let locked = entity.force_lock();
    let unlocked = locked.unlock(true);
    assert!(unlocked.is_ok());
}

#[test]
fn test_unlock_without_force_fails() {
    let entity =
        G1ApplicationEntity::<Active>::from_model(make_model(EnrollmentStatus::Approved));
    let locked = entity.force_lock();
    let result = locked.unlock(false);
    assert!(result.is_err());
    match result.unwrap_err() {
        TransitionError::EntityLocked { entity, .. } => assert_eq!(entity, "G1Application"),
        _ => panic!("expected EntityLocked"),
    }
}

#[test]
fn test_find_child() {
    let model = make_model(EnrollmentStatus::Draft);
    let child_id = model.child_id;
    let entity = G1ApplicationEntity::<Active>::from_model(model);
    assert_eq!(entity.find_child(), child_id);
}

#[test]
fn test_find_guardian() {
    let model = make_model(EnrollmentStatus::Draft);
    let guardian_id = model.guardian_id;
    let entity = G1ApplicationEntity::<Active>::from_model(model);
    assert_eq!(entity.find_guardian(), guardian_id);
}

#[test]
fn test_find_batch() {
    let model = make_model(EnrollmentStatus::Draft);
    let batch_id = model.batch_id;
    let entity = G1ApplicationEntity::<Active>::from_model(model);
    assert_eq!(entity.find_batch(), batch_id);
}

#[test]
fn test_update_wizard_step() {
    let mut entity = G1ApplicationEntity::<Active>::from_model(make_model(EnrollmentStatus::Draft));
    entity.update_wizard_step(5);
    assert_eq!(entity.inner().wizard_step, Some(5));
}

#[test]
fn test_set_enrollment_status() {
    let mut entity = G1ApplicationEntity::<Active>::from_model(make_model(EnrollmentStatus::Draft));
    entity.set_enrollment_status(EnrollmentStatus::Pending);
    assert_eq!(entity.inner().enrollment_status, EnrollmentStatus::Pending);
}

#[test]
fn test_into_inner() {
    let model = make_model(EnrollmentStatus::Draft);
    let id = model.id;
    let entity = G1ApplicationEntity::<Active>::from_model(model);
    let inner = entity.into_inner();
    assert_eq!(inner.id, id);
}

#[test]
fn test_from_model_trait() {
    let model = make_model(EnrollmentStatus::Draft);
    let entity: G1ApplicationEntity<Active> = model.clone().into();
    assert_eq!(entity.inner().id, model.id);
}
