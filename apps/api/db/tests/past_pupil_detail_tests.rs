use db::domain::past_pupil_detail::*;

fn make_past_pupil_model() -> db::entity::common::past_pupil_details::Model {
    db::entity::common::past_pupil_details::Model {
        id: uuid::Uuid::new_v4(),
        guardian_id: uuid::Uuid::new_v4(),
        school_id: uuid::Uuid::new_v4(),
        student_id: Some("STU001".to_string()),
        highest_grade: Some("A/L".to_string()),
        year_left: Some(2015),
        left_reason: None,
        verified: false,
        verification_method: None,
        created_at: chrono::Utc::now(),
    }
}

#[test]
fn test_past_pupil_from_model() {
    let model = make_past_pupil_model();
    let pp = PastPupilDetail::<Unverified>::from_model(model.clone());
    assert_eq!(pp.inner().id, model.id);
}

#[test]
fn test_past_pupil_verify() {
    let model = make_past_pupil_model();
    let pp = PastPupilDetail::<Unverified>::from_model(model);
    let verified = pp.verify("school_records".to_string()).unwrap();
    assert!(verified.model().verified);
    assert_eq!(
        verified.model().verification_method.as_deref(),
        Some("school_records")
    );
}

#[test]
fn test_past_pupil_from_trait() {
    let model = make_past_pupil_model();
    let id = model.id;
    let pp: PastPupilDetail<Unverified> = model.into();
    assert_eq!(pp.inner().id, id);
}
