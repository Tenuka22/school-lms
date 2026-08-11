use actix_web::ResponseError;
use db::domain::error::{AppError, TransitionError};
use rest::error::ApiError;

#[test]
fn test_app_error_display_variants() {
    assert_eq!(AppError::BadRequest("msg".into()).to_string(), "msg");
    assert_eq!(AppError::Unauthorized("msg".into()).to_string(), "msg");
    assert_eq!(AppError::Forbidden("msg".into()).to_string(), "msg");
    assert_eq!(AppError::NotFound("msg".into()).to_string(), "msg");
    assert_eq!(AppError::Conflict("msg".into()).to_string(), "msg");
    assert_eq!(AppError::Internal("msg".into()).to_string(), "msg");
}

#[test]
fn test_app_error_is_debug() {
    let e = AppError::BadRequest("test".into());
    assert!(format!("{e:?}").contains("BadRequest"));
}

#[test]
fn test_app_error_is_clone() {
    let e = AppError::NotFound("not here".into());
    let cloned = e.clone();
    assert_eq!(e.to_string(), cloned.to_string());
}

#[test]
fn test_app_error_is_std_error() {
    let e = AppError::Internal("oops".into());
    let _: &dyn std::error::Error = &e;
}

#[test]
fn test_app_error_from_transition_error_invalid_transition() {
    let te = TransitionError::InvalidTransition {
        from: "Draft",
        to: "Verified",
    };
    let ae: AppError = te.into();
    assert!(matches!(ae, AppError::BadRequest(_)));
    assert!(ae.to_string().contains("Draft"));
    assert!(ae.to_string().contains("Verified"));
}

#[test]
fn test_app_error_from_transition_error_missing_field() {
    let te = TransitionError::MissingField("full_name");
    let ae: AppError = te.into();
    assert!(matches!(ae, AppError::BadRequest(_)));
    assert!(ae.to_string().contains("full_name"));
}

#[test]
fn test_app_error_from_transition_error_business_rule() {
    let te = TransitionError::BusinessRule("must have guardian".into());
    let ae: AppError = te.into();
    assert!(matches!(ae, AppError::BadRequest(_)));
    assert!(ae.to_string().contains("must have guardian"));
}

#[test]
fn test_app_error_from_transition_error_entity_locked() {
    let te = TransitionError::EntityLocked {
        entity: "Application".into(),
        id: uuid::Uuid::nil(),
        status: "Submitted".into(),
    };
    let ae: AppError = te.into();
    assert!(matches!(ae, AppError::BadRequest(_)));
    assert!(ae.to_string().contains("Application"));
    assert!(ae.to_string().contains("Submitted"));
}

#[test]
fn test_api_error_from_app_error() {
    let ae = AppError::BadRequest("bad".into());
    let api: ApiError = ae.into();
    assert!(api.to_string().contains("bad"));
}

#[test]
fn test_api_error_from_transition_error() {
    let te = TransitionError::MissingField("name");
    let api: ApiError = te.into();
    assert!(api.to_string().contains("name"));
}

#[test]
fn test_api_error_conflict_with_duplicates_display() {
    use rest::error::ApiError;
    let api = ApiError::ConflictWithDuplicates(vec![]);
    assert_eq!(api.to_string(), "found 0 duplicate child(ren)");
}

#[test]
fn test_api_error_helper_methods() {
    let r = ApiError::bad_request("br");
    assert!(r.to_string().contains("br"));

    let r = ApiError::unauthorized("unauth");
    assert!(r.to_string().contains("unauth"));

    let r = ApiError::forbidden("forb");
    assert!(r.to_string().contains("forb"));

    let r = ApiError::not_found("nf");
    assert!(r.to_string().contains("nf"));

    let r = ApiError::conflict("conf");
    assert!(r.to_string().contains("conf"));

    let r = ApiError::internal("int");
    assert!(r.to_string().contains("int"));
}

#[test]
fn test_api_error_status_codes() {
    use actix_web::http::StatusCode;

    assert_eq!(ApiError::bad_request("").status_code(), StatusCode::BAD_REQUEST);
    assert_eq!(ApiError::unauthorized("").status_code(), StatusCode::UNAUTHORIZED);
    assert_eq!(ApiError::forbidden("").status_code(), StatusCode::FORBIDDEN);
    assert_eq!(ApiError::not_found("").status_code(), StatusCode::NOT_FOUND);
    assert_eq!(ApiError::conflict("").status_code(), StatusCode::CONFLICT);
    assert_eq!(ApiError::internal("").status_code(), StatusCode::INTERNAL_SERVER_ERROR);

    let dup = ApiError::ConflictWithDuplicates(vec![]);
    assert_eq!(dup.status_code(), StatusCode::CONFLICT);
}
