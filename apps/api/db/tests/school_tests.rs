use db::domain::school::*;
use db::entity::common::enums::{SchoolCategory, SchoolType};

fn make_school_model() -> db::entity::common::schools::Model {
    db::entity::common::schools::Model {
        id: uuid::Uuid::new_v4(),
        school_name_si: "Test School".to_string(),
        school_name_en: Some("Test School EN".to_string()),
        school_type: SchoolType::OneAB,
        address: Some("123 Main St".to_string()),
        district_id: None,
        category: SchoolCategory::Urban,
        grade_1_quota: 100,
        geo_latitude: None,
        geo_longitude: None,
        status: "Active".to_string(),
        created_at: chrono::Utc::now(),
    }
}

#[test]
fn test_school_from_model() {
    let model = make_school_model();
    let school = School::<Active>::from_model(model.clone());
    assert_eq!(school.inner().id, model.id);
}

#[test]
fn test_school_deactivate() {
    let model = make_school_model();
    let school = School::<Active>::from_model(model);
    let inactive = school.deactivate().unwrap();
    assert_eq!(inactive.model().status, "Inactive");
}

#[test]
fn test_school_reactivate() {
    let model = make_school_model();
    let school = School::<Active>::from_model(model);
    let inactive = school.deactivate().unwrap();
    let active = inactive.reactivate().unwrap();
    assert_eq!(active.inner().status, "Active");
}

#[test]
fn test_school_has_quota() {
    let model = make_school_model();
    let school = School::<Active>::from_model(model);
    assert!(school.has_quota());
}

#[test]
fn test_school_quota_remaining() {
    let model = make_school_model();
    let school = School::<Active>::from_model(model);
    assert_eq!(school.quota_remaining(30), 70);
    assert_eq!(school.quota_remaining(100), 0);
    assert_eq!(school.quota_remaining(150), 0);
}

#[test]
fn test_school_from_trait() {
    let model = make_school_model();
    let id = model.id;
    let school: School<Active> = model.into();
    assert_eq!(school.inner().id, id);
}
