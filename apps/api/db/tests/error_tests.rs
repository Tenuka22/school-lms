use db::domain::error::TransitionError;

#[test]
fn test_transition_error_display_invalid_transition() {
    let err = TransitionError::InvalidTransition {
        from: "Draft",
        to: "Submitted",
    };
    assert_eq!(err.to_string(), "Cannot transition from Draft to Submitted");
}

#[test]
fn test_transition_error_display_missing_field() {
    let err = TransitionError::MissingField("child_id");
    assert_eq!(err.to_string(), "Missing required field: child_id");
}

#[test]
fn test_transition_error_display_business_rule() {
    let err = TransitionError::BusinessRule("batch is closed".to_string());
    assert_eq!(err.to_string(), "Business rule violation: batch is closed");
}

#[test]
fn test_transition_error_display_entity_locked() {
    let id = uuid::Uuid::new_v4();
    let err = TransitionError::EntityLocked {
        entity: "G1Application".to_string(),
        id,
        status: "Approved".to_string(),
    };
    let msg = err.to_string();
    assert!(msg.contains("G1Application"));
    assert!(msg.contains(&id.to_string()));
    assert!(msg.contains("Approved"));
    assert!(msg.contains("force=true"));
}

#[test]
fn test_transition_error_is_clone() {
    let err = TransitionError::MissingField("test");
    let cloned = err.clone();
    assert_eq!(format!("{}", err), format!("{}", cloned));
}

#[test]
fn test_transition_error_is_debug() {
    let err = TransitionError::BusinessRule("test".to_string());
    let debug = format!("{:?}", err);
    assert!(debug.contains("BusinessRule"));
}
