use actix_web::{HttpResponse, web};
use serde::Serialize;
use utoipa::openapi::OpenApi as OpenApiDoc;
use utoipa::openapi::security::{Http, HttpAuthScheme, SecurityScheme};
use utoipa::{Modify, OpenApi, ToSchema};
use utoipa_scalar::{Scalar, Servable};

use crate::auth::handlers::{login, logout, logout_all, me, refresh, register};
use crate::counter;
use crate::enrollment_batches;
use crate::error::ErrorResponse;
use crate::g1_enrollments;
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
        me::me,
        counter::get_counter,
        counter::increment_counter,
        counter::get_secure_counter,
        counter::increment_secure_counter,
        uploads::upload_file,
        g1_enrollments::handlers::list::list_enrollments,
        g1_enrollments::handlers::get::get_enrollment,
        g1_enrollments::handlers::create::create_enrollment,
        g1_enrollments::handlers::update::update_enrollment,
        g1_enrollments::handlers::delete::delete_enrollment,
        enrollment_batches::handlers::list::list_batches,
        enrollment_batches::handlers::get::get_batch,
        enrollment_batches::handlers::create::create_batch,
        enrollment_batches::handlers::update::update_batch,
        enrollment_batches::handlers::delete::delete_batch,
    ),
    components(
        schemas(
            crate::auth::types::RegisterRequest,
            crate::auth::types::LoginRequest,
            crate::auth::types::RefreshRequest,
            crate::auth::types::AuthResponse,
            crate::auth::types::UserResponse,
            crate::counter::service::CounterResponse,
            crate::uploads::UploadResponse,
            db::entity::g1_enrollments::Model,
            db::entity::enrollment_batches::Model,
            crate::g1_enrollments::handlers::update::UpdateG1EnrollmentBody,
            crate::enrollment_batches::handlers::create::CreateBatchBody,
            crate::enrollment_batches::handlers::update::UpdateBatchBody,
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
