use actix_web::{HttpResponse, web};
use serde::Serialize;
use utoipa::openapi::OpenApi as OpenApiDoc;
use utoipa::openapi::security::{Http, HttpAuthScheme, SecurityScheme};
use utoipa::{Modify, OpenApi, ToSchema};
use utoipa_scalar::{Scalar, Servable};

use crate::auth::handlers::{login, logout, logout_all, refresh, register};
use crate::counter;
use crate::error::ErrorResponse;
use crate::uploads;

#[derive(Serialize, ToSchema)]
pub struct MessageResponse {
    pub message: String,
}

#[derive(OpenApi)]
#[openapi(
    info(
        title = "School LMS API",
        version = "0.1.0",
        description = "School Learning Management System API"
    ),
    paths(
        register::register,
        login::login,
        refresh::refresh,
        logout::logout,
        logout_all::logout_all,
        counter::get_counter,
        counter::increment_counter,
        counter::get_secure_counter,
        counter::increment_secure_counter,
        uploads::upload_file,
    ),
    components(
        schemas(
            crate::auth::types::RegisterRequest,
            crate::auth::types::LoginRequest,
            crate::auth::types::RefreshRequest,
            crate::auth::types::AuthResponse,
            crate::counter::service::CounterResponse,
            crate::uploads::UploadResponse,
            ErrorResponse,
            MessageResponse,
        )
    ),
    modifiers(&SecurityAddon),
)]
pub struct ApiDoc;

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut OpenApiDoc) {
        let components = openapi.components.get_or_insert_with(Default::default);
        components.add_security_scheme(
            "bearer_auth",
            SecurityScheme::Http(Http::new(HttpAuthScheme::Bearer)),
        );
    }
}

pub async fn openapi_json() -> HttpResponse {
    HttpResponse::Ok().json(ApiDoc::openapi())
}

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/openapi.json", web::get().to(openapi_json))
        .service(Scalar::with_url("/docs", ApiDoc::openapi()));
}
