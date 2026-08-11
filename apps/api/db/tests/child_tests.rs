use db::domain::child::*;
use db::entity::common::enums::{Gender, MediumOfInstruction, Nationality, StudentStatus};
use db::entity::g1::children;

fn make_child_model() -> children::Model {
    children::Model {
        id: uuid::Uuid::new_v4(),
        student_id: None,
        full_name: "Test Child".to_string(),
        name_with_initials: "T. Child".to_string(),
        date_of_birth: chrono::NaiveDate::from_ymd_opt(2015, 6, 15).unwrap(),
        gender: Gender::Male,
        birth_certificate_number: Some("BC12345".to_string()),
        nic: None,
        passport_number: None,
        name_with_initials_en: None,
        nationality: Nationality::SriLankan,
        religion: None,
        medium_of_instruction: MediumOfInstruction::Sinhala,
        disability_status: false,
        disability_type: None,
        photo_url: None,
        admission_number: None,
        admission_date: None,
        current_grade: None,
        phone: None,
        email: None,
        status: StudentStatus::Active,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        created_by: None,
        updated_by: None,
    }
}

#[test]
fn test_child_from_model() {
    let model = make_child_model();
    let child = Child::<Active>::from(model.clone());
    assert_eq!(child.inner().id, model.id);
}

#[test]
fn test_child_new() {
    let model = make_child_model();
    let id = model.id;
    let child = Child::<Active>::new(model);
    assert_eq!(child.inner().id, id);
}

#[test]
fn test_child_into_inner() {
    let model = make_child_model();
    let id = model.id;
    let child = Child::<Active>::new(model);
    let inner = child.into_inner();
    assert_eq!(inner.id, id);
}

#[test]
fn test_child_into_from_trait() {
    let model = make_child_model();
    let id = model.id;
    let child: Child<Active> = model.into();
    assert_eq!(child.inner().id, id);
}

#[test]
fn test_child_link() {
    let model = make_child_model();
    let student_id = uuid::Uuid::new_v4();
    let child = Child::<Active>::new(model);
    assert!(!child.is_linked());

    let linked = child.link(student_id);
    assert_eq!(linked.student_id(), student_id);
}

#[test]
fn test_child_unlink() {
    let model = children::Model {
        student_id: Some(uuid::Uuid::new_v4()),
        ..make_child_model()
    };
    let child = Child::<Active>::new(model);
    assert!(child.is_linked());

    let unlinked = child.unlink();
    assert!(!unlinked.inner().student_id.is_some());
}

#[test]
fn test_child_linked_to_unlinked() {
    let student_id = uuid::Uuid::new_v4();
    let model = children::Model {
        student_id: Some(student_id),
        ..make_child_model()
    };
    let child = Child::<Active>::new(model);
    let linked = child.link(uuid::Uuid::new_v4());
    let unlinked = linked.unlink();
    assert!(unlinked.inner().student_id.is_none());

    let relinked = unlinked.link(student_id);
    assert_eq!(relinked.student_id(), student_id);
}

#[test]
fn test_child_status_queries() {
    let model = make_child_model();
    let child = Child::<Active>::new(model);
    assert!(child.is_active());
    assert_eq!(child.status(), StudentStatus::Active);
}

#[test]
fn test_child_graduate() {
    let model = make_child_model();
    let child = Child::<Active>::new(model);
    let graduated = child.graduate();
    assert_eq!(graduated.status(), StudentStatus::Graduated);
}

#[test]
fn test_child_remove() {
    let model = make_child_model();
    let child = Child::<Active>::new(model);
    let removed = child.remove();
    assert_eq!(removed.status(), StudentStatus::Removed);
}

#[test]
fn test_child_identification_queries() {
    let model = make_child_model();
    let child = Child::<Active>::new(model);
    assert!(child.has_birth_certificate());
    assert!(!child.has_nic());
    assert!(!child.has_passport());
    assert!(child.has_any_identification());
}

#[test]
fn test_child_no_identification() {
    let model = children::Model {
        birth_certificate_number: None,
        nic: None,
        passport_number: None,
        ..make_child_model()
    };
    let child = Child::<Active>::new(model);
    assert!(!child.has_birth_certificate());
    assert!(!child.has_nic());
    assert!(!child.has_passport());
    assert!(!child.has_any_identification());
}

#[test]
fn test_child_student_id() {
    let model = make_child_model();
    let child = Child::<Active>::new(model);
    assert!(child.student_id().is_none());

    let student_id = uuid::Uuid::new_v4();
    let linked = child.link(student_id);
    assert_eq!(linked.student_id(), student_id);
}

#[test]
fn test_child_is_linked_active() {
    let model = make_child_model();
    let child = Child::<Active>::new(model);
    assert!(!child.is_linked());

    let linked = child.link(uuid::Uuid::new_v4());
    assert!(linked.inner().student_id.is_some());
}
