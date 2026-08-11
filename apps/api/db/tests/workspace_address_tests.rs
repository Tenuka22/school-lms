use db::domain::workspace_address::*;

fn make_workspace_model() -> db::entity::common::workspace_addresses::Model {
    db::entity::common::workspace_addresses::Model {
        id: uuid::Uuid::new_v4(),
        name: "Remote / Work From Home".to_string(),
        building: None,
        street_1: "N/A".to_string(),
        street_2: None,
        city: "Colombo".to_string(),
        state: None,
        postal_code: None,
        country: "Sri Lanka".to_string(),
        full_address: "Remote / Work From Home, Colombo, Sri Lanka".to_string(),
        created_at: chrono::Utc::now(),
    }
}

#[test]
fn test_workspace_from_model() {
    let model = make_workspace_model();
    let ws = WorkspaceAddress::<Active>::from_model(model.clone());
    assert_eq!(ws.inner().id, model.id);
}

#[test]
fn test_workspace_is_remote() {
    let model = make_workspace_model();
    let ws = WorkspaceAddress::<Active>::from_model(model);
    assert!(ws.is_remote());
}

#[test]
fn test_workspace_not_remote() {
    let mut model = make_workspace_model();
    model.name = "Office".to_string();
    let ws = WorkspaceAddress::<Active>::from_model(model);
    assert!(!ws.is_remote());
}

#[test]
fn test_workspace_from_trait() {
    let model = make_workspace_model();
    let id = model.id;
    let ws: WorkspaceAddress<Active> = model.into();
    assert_eq!(ws.inner().id, id);
}
