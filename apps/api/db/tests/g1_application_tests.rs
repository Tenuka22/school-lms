use db::domain::g1_application::*;
use db::domain::error::TransitionError;
use db::entity::common::enums::EnrollmentStatus;

fn make_draft_model() -> db::entity::g1::applications::Model {
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
        enrollment_status: EnrollmentStatus::Draft,
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
fn test_draft_new() {
    let batch_id = uuid::Uuid::new_v4();
    let app = G1Application::<Draft>::new(batch_id, "REF-001".to_string());
    assert_eq!(app.model.wizard_step, Some(1));
    assert_eq!(app.model.enrollment_status, EnrollmentStatus::Draft);
    assert_eq!(app.model.batch_id, batch_id);
}

#[test]
fn test_draft_advance_to_step2_with_child() {
    let batch_id = uuid::Uuid::new_v4();
    let mut app = G1Application::<Draft>::new(batch_id, "REF-001".to_string());
    app.model.child_id = uuid::Uuid::new_v4();

    let step2 = app.advance_to_step2();
    assert!(step2.is_ok());
    let step2 = step2.unwrap();
    assert_eq!(step2.model.wizard_step, Some(2));
}

#[test]
fn test_draft_advance_to_step2_without_child() {
    let batch_id = uuid::Uuid::new_v4();
    let app = G1Application::<Draft>::new(batch_id, "REF-001".to_string());

    let result = app.advance_to_step2();
    assert!(result.is_err());
    match result.unwrap_err() {
        TransitionError::MissingField(field) => assert_eq!(field, "child_id"),
        _ => panic!("expected MissingField"),
    }
}

#[test]
fn test_wizard_steps_progression() {
    let mut model = make_draft_model();
    model.wizard_step = Some(2);

    let step2 = G1Application::<WizardStep2> {
        model,
        _state: std::marker::PhantomData,
    };
    let step3 = step2.advance_to_step3().unwrap();
    assert_eq!(step3.model.wizard_step, Some(3));

    let step4 = step3.advance_to_step4().unwrap();
    assert_eq!(step4.model.wizard_step, Some(4));

    let step5 = step4.advance_to_step5().unwrap();
    assert_eq!(step5.model.wizard_step, Some(5));

    let step6 = step5.advance_to_step6().unwrap();
    assert_eq!(step6.model.wizard_step, Some(6));

    let step7 = step6.advance_to_step7().unwrap();
    assert_eq!(step7.model.wizard_step, Some(7));
}

#[test]
fn test_submit_requires_declaration_and_child() {
    let mut model = make_draft_model();
    model.wizard_step = None;
    model.declaration_agreed = false;

    let step7 = G1Application::<WizardStep7> {
        model,
        _state: std::marker::PhantomData,
    };
    let result = step7.submit();
    assert!(result.is_err());
    match result.unwrap_err() {
        TransitionError::MissingField(field) => assert_eq!(field, "declaration_agreed"),
        _ => panic!("expected MissingField for declaration_agreed"),
    }
}

#[test]
fn test_submit_success() {
    let mut model = make_draft_model();
    model.wizard_step = None;
    model.declaration_agreed = true;

    let step7 = G1Application::<WizardStep7> {
        model,
        _state: std::marker::PhantomData,
    };
    let submitted = step7.submit().unwrap();
    assert_eq!(
        submitted.model.enrollment_status,
        EnrollmentStatus::Completed
    );
    assert!(submitted.model.submitted_at.is_some());
    assert_eq!(submitted.model.wizard_step, None);
}

#[test]
fn test_submitted_to_under_verification() {
    let mut model = make_draft_model();
    model.enrollment_status = EnrollmentStatus::Completed;
    model.submitted_at = Some(chrono::Utc::now());

    let submitted = G1Application::<Submitted> {
        model,
        _state: std::marker::PhantomData,
    };
    let under_verification = submitted.start_verification().unwrap();
    assert_eq!(
        under_verification.model.enrollment_status,
        EnrollmentStatus::PendingApproval
    );
}

#[test]
fn test_verify_requires_all_flags() {
    let mut model = make_draft_model();
    model.enrollment_status = EnrollmentStatus::PendingApproval;
    model.birth_certificate_verified = false;

    let uv = G1Application::<UnderVerification> {
        model,
        _state: std::marker::PhantomData,
    };
    let result = uv.verify();
    assert!(result.is_err());
}

#[test]
fn test_verify_success() {
    let mut model = make_draft_model();
    model.enrollment_status = EnrollmentStatus::PendingApproval;
    model.birth_certificate_verified = true;
    model.age_eligibility_verified = true;
    model.residence_verified = true;
    model.category_verified = true;

    let uv = G1Application::<UnderVerification> {
        model,
        _state: std::marker::PhantomData,
    };
    let verified = uv.verify().unwrap();
    assert_eq!(verified.model.enrollment_status, EnrollmentStatus::Approved);
    assert!(verified.model.verified_at.is_some());
}

#[test]
fn test_verified_admit() {
    let mut model = make_draft_model();
    model.enrollment_status = EnrollmentStatus::Approved;

    let verified = G1Application::<Verified> {
        model,
        _state: std::marker::PhantomData,
    };
    let admitted = verified.admit().unwrap();
    assert_eq!(admitted.model.enrollment_status, EnrollmentStatus::Admitted);
    assert!(admitted.model.finalized_at.is_some());
}

#[test]
fn test_verified_reject() {
    let mut model = make_draft_model();
    model.enrollment_status = EnrollmentStatus::Approved;

    let verified = G1Application::<Verified> {
        model,
        _state: std::marker::PhantomData,
    };
    let rejected = verified
        .reject("not qualified".to_string())
        .unwrap();
    assert_eq!(
        rejected.model.enrollment_status,
        EnrollmentStatus::Rejected
    );
    assert_eq!(
        rejected.model.rejection_reason.as_deref(),
        Some("not qualified")
    );
}

#[test]
fn test_inner_and_into_inner() {
    let batch_id = uuid::Uuid::new_v4();
    let app = G1Application::<Draft>::new(batch_id, "REF-001".to_string());
    let id = app.inner().id;
    let inner = app.into_inner();
    assert_eq!(inner.id, id);
}
