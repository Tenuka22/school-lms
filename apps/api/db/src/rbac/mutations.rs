use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter};

use crate::entity::{role, user_role};

pub async fn assign_user_role(
    db: &DatabaseConnection,
    user_id: i32,
    role_name: &str,
) -> Result<(), DbErr> {
    let role = role::Entity::find()
        .filter(role::Column::Name.eq(role_name))
        .one(db)
        .await?
        .ok_or_else(|| DbErr::Custom(format!("Role '{}' not found", role_name)))?;

    let existing = user_role::Entity::find()
        .filter(user_role::Column::UserId.eq(user_id))
        .filter(user_role::Column::RoleId.eq(role.id))
        .one(db)
        .await?;

    if existing.is_none() {
        user_role::ActiveModel {
            user_id: sea_orm::ActiveValue::Set(user_id),
            role_id: sea_orm::ActiveValue::Set(role.id),
        }
        .insert(db)
        .await?;
    }

    Ok(())
}

pub async fn ensure_admin_role(db: &DatabaseConnection, user_id: i32) -> Result<(), DbErr> {
    assign_user_role(db, user_id, "admin").await
}
