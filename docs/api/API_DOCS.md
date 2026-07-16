# API Documentation (OpenAPI / Scalar)

## Overview

The REST API uses [utoipa](https://crates.io/crates/utoipa) to auto-generate an
OpenAPI 3.1 spec. The spec is served in two ways:

| Endpoint              | Description                                    |
|-----------------------|------------------------------------------------|
| `GET /api/openapi.json` | Raw OpenAPI JSON spec, generated in-memory    |
| `GET /api/docs`       | Interactive [Scalar](https://scalar.com/) UI   |

## How It Works

### ApiDoc struct (`rest/src/docs.rs`)

All endpoints, request bodies, response schemas, and security schemes are
declared in the `#[derive(OpenApi)]` struct:

```rust
#[derive(OpenApi)]
#[openapi(
    info(title = "School LMS API", version = "0.1.0"),
    paths(endpoint_a, endpoint_b, /* ... */),
    components(schemas(RequestA, ResponseB, /* ... */)),
    modifiers(&SecurityAddon),
)]
pub struct ApiDoc;
```

### Path annotations

Every handler function carries a `#[utoipa::path(...)]` attribute that
documents its method, path, request body, response codes, and security
requirements:

```rust
#[utoipa::path(
    post,
    path = "/api/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = AuthResponse),
        (status = 401, description = "Invalid credentials", body = ErrorResponse),
    ),
)]
pub async fn login(...) -> Result<HttpResponse, ApiError> { ... }
```

### Security scheme

All endpoints that require authentication (counter, logout-all) declare a
`security("bearer_auth")` attribute. The `SecurityAddon` modifier adds a
**Bearer JWT** scheme to the global components section.

## Adding a new endpoint

1. Add a handler function with `#[utoipa::path(...)]` — include every response
   code and its body type.
2. Ensure request/response types derive `ToSchema`.
3. Register the function in the `paths(...)` list of `#[derive(OpenApi)]`.
4. Register any new types in the `schemas(...)` list.
5. Add the route in the appropriate `routes()` function.

## Dependencies

| Crate             | Version | Purpose                     |
|-------------------|---------|-----------------------------|
| `utoipa`          | 5       | OpenAPI generation          |
| `utoipa-scalar`   | 0.3     | Scalar UI integration       |
