use actix_web::ResponseError;
use rest::error::ApiError;

#[actix_web::test]
async fn test_api_error_status_codes() {
    use actix_web::http::StatusCode;

    let cases: Vec<(ApiError, StatusCode)> = vec![
        (ApiError::bad_request("br"), StatusCode::BAD_REQUEST),
        (ApiError::unauthorized("unauth"), StatusCode::UNAUTHORIZED),
        (ApiError::forbidden("forb"), StatusCode::FORBIDDEN),
        (ApiError::not_found("nf"), StatusCode::NOT_FOUND),
        (ApiError::conflict("conf"), StatusCode::CONFLICT),
        (ApiError::internal("int"), StatusCode::INTERNAL_SERVER_ERROR),
        (
            ApiError::ConflictWithDuplicates(vec![]),
            StatusCode::CONFLICT,
        ),
    ];

    for (err, expected_status) in cases {
        assert_eq!(err.status_code(), expected_status, "Testing {err}");
    }
}

#[actix_web::test]
async fn test_api_error_response_body() {
    let err = ApiError::bad_request("something went wrong");
    let http_err: &dyn actix_web::ResponseError = &err;

    let resp = http_err.error_response();
    let (parts, body) = resp.into_parts();
    assert_eq!(parts.status(), 400);

    let bytes = actix_web::body::to_bytes(body).await.unwrap();
    let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(json["error"], "something went wrong");
}

#[actix_web::test]
async fn test_api_error_conflict_with_duplicates_response_body() {
    let err = ApiError::ConflictWithDuplicates(vec![]);
    let http_err: &dyn actix_web::ResponseError = &err;

    let resp = http_err.error_response();
    let (parts, body) = resp.into_parts();
    assert_eq!(parts.status(), 409);

    let bytes = actix_web::body::to_bytes(body).await.unwrap();
    let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert!(json.get("duplicates").is_some());
    assert!(json.get("error").is_some());
}

#[actix_web::test]
async fn test_error_response_display_format() {
    let err = ApiError::bad_request("email is required");
    assert_eq!(err.to_string(), "email is required");

    let err = ApiError::unauthorized("not authenticated");
    assert_eq!(err.to_string(), "not authenticated");

    let err = ApiError::forbidden("insufficient permissions");
    assert_eq!(err.to_string(), "insufficient permissions");

    let err = ApiError::not_found("resource not found");
    assert_eq!(err.to_string(), "resource not found");

    let err = ApiError::conflict("already exists");
    assert_eq!(err.to_string(), "already exists");

    let err = ApiError::internal("something broke");
    assert_eq!(err.to_string(), "something broke");

    let err = ApiError::ConflictWithDuplicates(vec![]);
    assert_eq!(err.to_string(), "found 0 duplicate child(ren)");
}

#[actix_web::test]
async fn test_api_error_from_impls_compile() {
    // AppError -> ApiError
    let app_err = db::domain::error::AppError::BadRequest("test".into());
    let api_err: ApiError = app_err.into();
    assert!(api_err.to_string().contains("test"));

    // DbErr -> ApiError
    let db_err = sea_orm::DbErr::Custom("db error".into());
    let api_err: ApiError = db_err.into();
    assert!(api_err.to_string().contains("internal error"));

    // TransitionError -> ApiError
    let te = db::domain::error::TransitionError::MissingField("name");
    let api_err: ApiError = te.into();
    assert!(api_err.to_string().contains("name"));
}
