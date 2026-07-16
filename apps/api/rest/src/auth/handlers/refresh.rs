use actix_web::{HttpResponse, web};
use chrono::{Duration, Utc};
use db::entity::session;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    QueryFilter, QuerySelect, Set, TransactionError, TransactionTrait, sea_query::LockType,
};

use crate::auth::middleware::JwtSecret;
use crate::auth::service::{create_access_token, generate_refresh_token, hash_refresh_token};
use crate::auth::types::{AuthResponse, RefreshRequest};
use crate::error::{ApiError, ErrorResponse};

#[utoipa::path(
    post,
    path = "/api/auth/refresh",
    request_body = RefreshRequest,
    responses(
        (status = 200, description = "Token refreshed successfully", body = AuthResponse),
        (status = 401, description = "Invalid or reused refresh token", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse),
    ),
)]
pub async fn refresh(
    db: web::Data<DatabaseConnection>,
    body: web::Json<RefreshRequest>,
    jwt_secret: web::Data<JwtSecret>,
) -> Result<HttpResponse, ApiError> {
    let token_hash = hash_refresh_token(&body.refresh_token);
    let secret = jwt_secret.0.clone();

    let result = db
        .transaction::<_, _, DbErr>(|txn| {
            let token_hash = token_hash.clone();
            let secret = secret.clone();

            Box::pin(async move {
                let session = session::Entity::find()
                    .filter(session::Column::RefreshTokenHash.eq(&token_hash))
                    .filter(session::Column::ExpiresAt.gt(Utc::now()))
                    .lock(LockType::Update)
                    .one(txn)
                    .await?
                    .ok_or_else(|| DbErr::Custom("invalid refresh token".into()))?;

                if session.revoked_at.is_some() {
                    let user_id = session.user_id;
                    revoke_all_user_sessions(txn, user_id).await?;
                    return Err(DbErr::Custom(
                        "refresh token reused — all sessions revoked".into(),
                    ));
                }

                let user_id = session.user_id;
                let mut active: session::ActiveModel = session.into();
                active.revoked_at = Set(Some(Utc::now()));
                active.update(txn).await?;

                let (raw_refresh, refresh_hash) = generate_refresh_token();
                let now = Utc::now();

                let new_session = session::ActiveModel {
                    user_id: Set(user_id),
                    refresh_token_hash: Set(refresh_hash),
                    issued_at: Set(now),
                    expires_at: Set(now + Duration::days(30)),
                    revoked_at: Set(None),
                    user_agent: Set(None),
                    ip: Set(None),
                    ..Default::default()
                };

                new_session.insert(txn).await?;

                let access_token =
                    create_access_token(user_id, &secret).map_err(|e| DbErr::Custom(e))?;

                Ok((access_token, raw_refresh))
            })
        })
        .await;

    match result {
        Ok((access_token, raw_refresh)) => Ok(HttpResponse::Ok().json(AuthResponse {
            access_token,
            refresh_token: raw_refresh,
        })),
        Err(TransactionError::Transaction(e)) | Err(TransactionError::Connection(e)) => {
            let msg = e.to_string();
            if msg.contains("reused") || msg == "invalid refresh token" {
                return Err(ApiError::Unauthorized(msg));
            }
            log::error!("Refresh transaction failed: {e}");
            Err(ApiError::Internal("internal error".into()))
        }
    }
}

async fn revoke_all_user_sessions(txn: &DatabaseTransaction, user_id: i32) -> Result<(), DbErr> {
    use sea_orm::sea_query::Expr;

    session::Entity::update_many()
        .col_expr(session::Column::RevokedAt, Expr::value(Utc::now()).into())
        .filter(session::Column::UserId.eq(user_id))
        .filter(session::Column::RevokedAt.is_null())
        .exec(txn)
        .await?;
    Ok(())
}
