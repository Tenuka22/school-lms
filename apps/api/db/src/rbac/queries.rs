use sea_orm::{ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter};
use uuid::Uuid;

use crate::entity::{user::permission, user::role, user::role_permission, user::user_role};
use crate::rbac::types::Role;

pub async fn get_user_permissions(
    db: &DatabaseConnection,
    user_id: Option<Uuid>,
) -> Result<Vec<String>, DbErr> {
    let role_ids = match user_id {
        Some(uid) => {
            let urs = user_role::Entity::find()
                .filter(user_role::Column::UserId.eq(uid))
                .all(db)
                .await?;
            urs.into_iter().map(|ur| ur.role_id).collect::<Vec<_>>()
        }
        None => {
            let unauth = role::Entity::find()
                .filter(role::Column::Name.eq(Role::Unauthenticated.to_string()))
                .one(db)
                .await?;
            match unauth {
                Some(r) => vec![r.id],
                None => return Ok(Vec::new()),
            }
        }
    };

    if role_ids.is_empty() {
        return Ok(Vec::new());
    }

    let rps = role_permission::Entity::find()
        .filter(role_permission::Column::RoleId.is_in(role_ids))
        .all(db)
        .await?;

    let perm_ids: Vec<i32> = rps.into_iter().map(|rp| rp.permission_id).collect();

    if perm_ids.is_empty() {
        return Ok(Vec::new());
    }

    let perms = permission::Entity::find()
        .filter(permission::Column::Id.is_in(perm_ids))
        .all(db)
        .await?;

    Ok(perms.into_iter().map(|p| p.name).collect())
}

pub async fn get_user_roles(db: &DatabaseConnection, user_id: Uuid) -> Result<Vec<Role>, DbErr> {
    let urs = user_role::Entity::find()
        .filter(user_role::Column::UserId.eq(user_id))
        .all(db)
        .await?;

    let role_ids: Vec<i32> = urs.into_iter().map(|ur| ur.role_id).collect();

    if role_ids.is_empty() {
        return Ok(Vec::new());
    }

    let roles = role::Entity::find()
        .filter(role::Column::Id.is_in(role_ids))
        .all(db)
        .await?;

    Ok(roles
        .into_iter()
        .map(|r| Role::from(r.name.as_str()))
        .collect())
}
