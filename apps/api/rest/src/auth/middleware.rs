use std::{
    future::{Future, Ready, ready},
    pin::Pin,
    task::{Context, Poll},
};

use actix_web::{
    Error, FromRequest, HttpMessage, HttpRequest,
    body::MessageBody,
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    web,
};

use crate::error::ApiError;
use apistos::ApiSecurity;
use jsonwebtoken::{DecodingKey, Validation, decode};
use sea_orm::DatabaseConnection;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use db::rbac::Permission;

pub struct JwtSecret(pub String);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
}

#[derive(ApiSecurity)]
#[openapi_security(scheme(security_type(http(scheme = "bearer", bearer_format = "JWT"))))]
pub struct AuthenticatedUser {
    pub user_id: Option<Uuid>,
    pub permissions: Vec<String>,
}

impl AuthenticatedUser {
    pub fn require_permission(&self, permission: Permission) -> Result<(), Error> {
        let perm_str = permission.as_str();
        let has_wildcard = self.permissions.iter().any(|p| p == "*:*");
        let has_perm = self.permissions.iter().any(|p| p == perm_str);
        if has_wildcard || has_perm {
            Ok(())
        } else {
            log::error!(
                "Permission denied: user={:?} required={} permissions={:?}",
                self.user_id,
                perm_str,
                self.permissions
            );
            Err(ApiError::forbidden("insufficient permissions").into())
        }
    }
}

impl FromRequest for AuthenticatedUser {
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(req: &HttpRequest, _: &mut actix_web::dev::Payload) -> Self::Future {
        let claims = req.extensions().get::<Claims>().cloned();
        let db = req.app_data::<web::Data<DatabaseConnection>>().cloned();

        Box::pin(async move {
            let db = db.ok_or_else(|| ApiError::internal("DB not configured"))?;
            let user_id = claims.map(|c| Uuid::parse_str(&c.sub).ok()).flatten();

            let permissions = db::rbac::get_user_permissions(&db, user_id.clone())
                .await
                .map_err(|e| {
                    log::error!("Failed to load permissions: {e}");
                    ApiError::internal("permission lookup failed")
                })?;

            Ok(AuthenticatedUser {
                user_id,
                permissions,
            })
        })
    }
}

fn token_claims(req: &HttpRequest) -> Option<Claims> {
    let auth_header = req
        .headers()
        .get("Authorization")?
        .to_str()
        .ok()?
        .strip_prefix("Bearer ")?;

    let jwt_secret = req.app_data::<web::Data<JwtSecret>>()?;

    decode::<Claims>(
        auth_header,
        &DecodingKey::from_secret(jwt_secret.0.as_bytes()),
        &Validation::default(),
    )
    .ok()
    .map(|d| d.claims)
}

pub struct AuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddlewareService { service }))
    }
}

pub struct AuthMiddlewareService<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        if let Some(claims) = token_claims(req.request()) {
            req.extensions_mut().insert(claims);
        }

        let fut = self.service.call(req);
        Box::pin(async move { fut.await })
    }
}
