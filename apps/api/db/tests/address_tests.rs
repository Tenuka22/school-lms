use db::domain::address::*;
use db::entity::common::enums::ResidenceType;

fn make_address_model() -> db::entity::common::addresses::Model {
    db::entity::common::addresses::Model {
        id: uuid::Uuid::new_v4(),
        address_line_1: "123 Main St".to_string(),
        address_line_2: None,
        city: "Galle".to_string(),
        district: "Galle".to_string(),
        province: "Southern".to_string(),
        gs_division: "Galle GD".to_string(),
        postal_code: Some("80000".to_string()),
        latitude: None,
        longitude: None,
        distance_to_school_km: None,
        verified_by_map: false,
        residence_type: Some(ResidenceType::Owned),
        ownership_proof: None,
        created_at: chrono::Utc::now(),
    }
}

#[test]
fn test_address_from_model() {
    let model = make_address_model();
    let addr = Address::<Unverified>::from_model(model.clone());
    assert_eq!(addr.inner().id, model.id);
}

#[test]
fn test_address_verify_by_map() {
    let model = make_address_model();
    let addr = Address::<Unverified>::from_model(model);
    let verified = addr.verify_by_map().unwrap();
    assert!(verified.model().verified_by_map);
}

#[test]
fn test_address_from_trait() {
    let model = make_address_model();
    let id = model.id;
    let addr: Address<Unverified> = model.into();
    assert_eq!(addr.inner().id, id);
}

#[test]
fn test_address_into_inner() {
    let model = make_address_model();
    let id = model.id;
    let addr = Address::<Unverified>::from_model(model);
    let inner = addr.into_inner();
    assert_eq!(inner.id, id);
}
