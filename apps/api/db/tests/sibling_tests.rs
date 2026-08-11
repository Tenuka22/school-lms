use db::domain::sibling::*;

fn make_sibling_model() -> db::entity::common::siblings::Model {
    db::entity::common::siblings::Model {
        id: uuid::Uuid::new_v4(),
        student_id: uuid::Uuid::new_v4(),
        school_id: uuid::Uuid::new_v4(),
        sibling_name: "Test Sibling".to_string(),
        current_grade: Some(5),
        admission_year: Some(2023),
        verified: false,
        verification_doc: None,
        created_at: chrono::Utc::now(),
    }
}

#[test]
fn test_sibling_from_model() {
    let model = make_sibling_model();
    let sibling = Sibling::<Unverified>::from_model(model.clone());
    assert_eq!(sibling.inner().id, model.id);
}

#[test]
fn test_sibling_verify() {
    let model = make_sibling_model();
    let sibling = Sibling::<Unverified>::from_model(model);
    let verified = sibling
        .verify("https://example.com/doc.pdf".to_string())
        .unwrap();
    assert!(verified.model().verified);
    assert_eq!(
        verified.model().verification_doc.as_deref(),
        Some("https://example.com/doc.pdf")
    );
}

#[test]
fn test_sibling_from_trait() {
    let model = make_sibling_model();
    let id = model.id;
    let sibling: Sibling<Unverified> = model.into();
    assert_eq!(sibling.inner().id, id);
}
