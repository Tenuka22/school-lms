use db::domain::staff_detail::*;
use db::entity::common::enums::{StaffEmploymentType, StaffType};

fn make_staff_model() -> db::entity::common::staff_details::Model {
    db::entity::common::staff_details::Model {
        id: uuid::Uuid::new_v4(),
        guardian_id: uuid::Uuid::new_v4(),
        school_id: uuid::Uuid::new_v4(),
        staff_type: Some(StaffType::Teacher),
        employee_id: Some("EMP001".to_string()),
        designation: Some("Senior Teacher".to_string()),
        employment_type: Some(StaffEmploymentType::Permanent),
        service_start_date: Some(chrono::NaiveDate::from_ymd_opt(2020, 1, 1).unwrap()),
        service_end_date: None,
        is_current: true,
        verification_doc: None,
        distance_from_residence_km: None,
        created_at: chrono::Utc::now(),
    }
}

#[test]
fn test_staff_from_model() {
    let model = make_staff_model();
    let staff = StaffDetail::<Current>::from_model(model.clone());
    assert_eq!(staff.inner().id, model.id);
}

#[test]
fn test_staff_end_service() {
    let model = make_staff_model();
    let staff = StaffDetail::<Current>::from_model(model);
    let former = staff.end_service().unwrap();
    assert!(!former.model().is_current);
    assert!(former.model().service_end_date.is_some());
}

#[test]
fn test_staff_from_trait() {
    let model = make_staff_model();
    let id = model.id;
    let staff: StaffDetail<Current> = model.into();
    assert_eq!(staff.inner().id, id);
}
