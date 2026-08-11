# Typed Error Handling

## Design

All API errors flow through a single `ApiError` enum (`rest/src/error.rs`)
that implements `actix_web::ResponseError`:

```rust
pub enum ApiError {
    BadRequest(String),     // 400
    Unauthorized(String),   // 401
    Forbidden(String),      // 403
    NotFound(String),       // 404
    Conflict(String),       // 409
    Internal(String),       // 500
}
```

Each variant maps to the correct HTTP status code and serialises a JSON body
of the form `{ "error": "<message>" }`.

Error status codes are documented in the OpenAPI spec via the `ApiErrorComponent`
derive macro:

```rust
#[derive(Debug, ApiErrorComponent)]
#[openapi_error(
    status(code = 400),
    status(code = 401),
    status(code = 403),
    status(code = 404),
    status(code = 409),
    status(code = 500),
)]
pub enum ApiError { ... }
```

## Propagation with `?`

`ApiError` implements `From<sea_orm::DbErr>` so database errors propagate
automatically as 500s with a log entry:

```rust
// Before
let user = new_user.insert(db).await.map_err(|e| {
    log::error!("insert failed: {e}");
    ApiError::Internal("internal error".into())
})?;

// After
let user = new_user.insert(db).await?;   // DbErr → ApiError::Internal
```

Non-DB errors use explicit `map_err` or `ok_or_else`:

```rust
let user = find_user(db).await?
    .ok_or_else(|| ApiError::Unauthorized("invalid credentials".into()))?;

let token = create_jwt(id).map_err(|e| {
    log::error!("JWT error: {e}");
    ApiError::Internal("internal error".into())
})?;
```

## Handler return type

Every handler returns `Result<Json<T>, ApiError>` (or `Result<CreatedJson<T>, ApiError>`
for 201 responses):

```rust
pub async fn login(...) -> Result<Json<AuthResponse>, ApiError> {
    // ... use ? throughout ...
    Ok(Json(AuthResponse { ... }))
}
```

actix-web automatically calls `ResponseError::error_response()` when an
`Err(ApiError)` is returned, producing the correct JSON body and status code.

## Edge cases

| Case | Handling |
|------|----------|
| Refresh token reuse | Manually matched in `refresh.rs` (returns `ApiError::Unauthorized`) |
| Role assignment failure | Logged and swallowed (non-critical) |
