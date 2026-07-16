use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use chrono::Duration;
use jsonwebtoken::{EncodingKey, Header, encode};
use rand::RngCore;
use sha2::{Digest, Sha256};

use crate::auth::Claims;

pub fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| format!("password hashing failed: {e}"))
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, String> {
    let parsed = PasswordHash::new(hash).map_err(|e| format!("invalid password hash: {e}"))?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok())
}

pub fn create_access_token(user_id: i32, secret: &str) -> Result<String, String> {
    let now = chrono::Utc::now();
    let claims = Claims {
        sub: user_id as i64,
        exp: (now + Duration::minutes(15)).timestamp() as usize,
        iat: now.timestamp() as usize,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| format!("JWT encoding failed: {e}"))
}

pub fn generate_refresh_token() -> (String, String) {
    let mut bytes = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut bytes);
    let raw = hex::encode(bytes);
    let hash = hex::encode(Sha256::digest(&bytes));
    (raw, hash)
}

pub fn hash_refresh_token(raw: &str) -> String {
    hex::encode(Sha256::digest(raw.as_bytes()))
}
