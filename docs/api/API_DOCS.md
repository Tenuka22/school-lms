# API Documentation (OpenAPI / Scalar)

## Overview

The REST API uses [apistos](https://github.com/netwo-io/apistos) to auto-generate an
OpenAPI 3.0 spec. The spec is served in two ways:

| Endpoint              | Description                                    |
|-----------------------|------------------------------------------------|
| `GET /openapi.json` | Raw OpenAPI JSON spec, generated in-memory    |
| `GET /docs`         | Interactive [Scalar](https://scalar.com/) UI   |

## How It Works

### Setup (`api/src/main.rs`)

The `Spec` struct holds the API metadata and is passed to `App::document()`:

```rust
let spec = Spec {
    info: Info {
        title: "School LMS API".to_string(),
        version: "0.1.0".to_string(),
        description: Some("School Learning Management System API".to_string()),
        ..Default::default()
    },
    ..Default::default()
};

App::new()
    .document(spec)
    .wrap(Logger::default())
    .wrap(cors)
    // ... app_data, configure ...
    .build_with(
        "/openapi.json",
        BuildConfig::default().with(ScalarConfig::new(&"/docs")),
    )
```

### Handler annotations

Every handler function carries a `#[api_operation(...)]` attribute that
documents its tag, summary, and security requirements:

```rust
#[api_operation(tag = "auth")]
pub async fn login(
    db: web::Data<DatabaseConnection>,
    body: Json<LoginRequest>,
) -> Result<Json<AuthResponse>, ApiError> { ... }
```

### Security scheme

The **Bearer JWT** security scheme is auto-documented via the `ApiSecurity` derive on
`AuthenticatedUser` (`rest/src/auth/middleware.rs`). Handlers that take `AuthenticatedUser`
as a parameter are automatically marked as requiring bearer auth.

### Schema registration

Types are auto-registered when they appear as handler parameters or return types.
No manual schema list is needed. Types derive both `JsonSchema` and `ApiComponent`:

```rust
#[derive(Deserialize, Serialize, JsonSchema, ApiComponent)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}
```

### Error codes

Error status codes are documented via `ApiErrorComponent` on `ApiError`:

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

## Adding a new endpoint

1. Add a handler function with `#[api_operation(tag = "...")]`.
2. Ensure request/response types derive `JsonSchema` and `ApiComponent`.
3. Register the route using `apistos::web::*` instead of `actix_web::web::*`.
4. Use `Json<T>`, `CreatedJson<T>`, or `NoContent` return types from `apistos::actix`.

## Dependencies

| Crate                      | Version | Purpose                     |
|----------------------------|---------|-----------------------------|
| `apistos`                  | 0.6     | OpenAPI generation          |
| `apistos-schemars`         | 0.8     | JSON Schema derivation      |
| `apistos-scalar`           | 0.6     | Scalar UI integration       |
