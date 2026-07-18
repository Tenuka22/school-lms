use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter};
use std::collections::HashMap;

use crate::entity::{user::permission, user::role, user::role_permission};

pub async fn seed_defaults(db: &DatabaseConnection) -> Result<(), DbErr> {
    let roles = vec![
        ("admin", "Full system access"),
        ("unknown", "Logged-in basic user"),
        ("unauthenticated", "No JWT / public user"),
    ];

    for (name, desc) in &roles {
        if role::Entity::find()
            .filter(role::Column::Name.eq(*name))
            .one(db)
            .await?
            .is_none()
        {
            role::ActiveModel {
                id: sea_orm::ActiveValue::NotSet,
                name: sea_orm::ActiveValue::Set(name.to_string()),
                description: sea_orm::ActiveValue::Set(Some(desc.to_string())),
            }
            .insert(db)
            .await?;
        }
    }

    let permissions = vec![
        ("profile:read", "profile", "read"),
        ("profile:update", "profile", "update"),
        ("counter:read", "counter", "read"),
        ("counter:increment", "counter", "increment"),
        ("counter:secure:read", "counter", "secure:read"),
        ("counter:secure:increment", "counter", "secure:increment"),
        ("course:list", "course", "list"),
        ("announcement:read", "announcement", "read"),
        ("file:upload", "file", "upload"),
        ("g1:application:create", "g1_application", "create"),
        ("g1:application:read", "g1_application", "read"),
        ("g1:application:update", "g1_application", "update"),
        ("g1:application:delete", "g1_application", "delete"),
        ("g1:application:submit", "g1_application", "submit"),
        ("g1:application:verify", "g1_application", "verify"),
        ("g1:application:mark", "g1_application", "mark"),
        ("g1:application:generate-lists", "g1_application", "generate-lists"),
        ("g1:document:upload", "g1_document", "upload"),
        ("g1:document:verify", "g1_document", "verify"),
        ("g1:appeal:create", "g1_appeal", "create"),
        ("g1:appeal:review", "g1_appeal", "review"),
        ("g1:report:read", "g1_report", "read"),
        ("*:*", "*", "*"),
    ];

    let mut perm_ids: Vec<(String, i32)> = Vec::new();
    for (name, resource, action) in &permissions {
        let existing = permission::Entity::find()
            .filter(permission::Column::Name.eq(*name))
            .one(db)
            .await?;

        let pid = if let Some(p) = existing {
            p.id
        } else {
            let result = permission::ActiveModel {
                id: sea_orm::ActiveValue::NotSet,
                name: sea_orm::ActiveValue::Set(name.to_string()),
                resource: sea_orm::ActiveValue::Set(resource.to_string()),
                action: sea_orm::ActiveValue::Set(action.to_string()),
            }
            .insert(db)
            .await?;
            result.id
        };
        perm_ids.push((name.to_string(), pid));
    }

    let role_map: HashMap<String, i32> = role::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .map(|r| (r.name, r.id))
        .collect();

    let perm_map: HashMap<String, i32> = perm_ids.into_iter().collect();

    let admin_role_id = role_map.get("admin").unwrap();
    let unknown_role_id = role_map.get("unknown").unwrap();
    let unauth_role_id = role_map.get("unauthenticated").unwrap();

    let role_perms: Vec<(&i32, Vec<&str>)> = vec![
        (admin_role_id, vec!["*:*"]),
        (
            unknown_role_id,
            vec![
                "profile:read",
                "profile:update",
                "counter:read",
                "counter:increment",
            ],
        ),
        (
            unauth_role_id,
            vec!["counter:read", "course:list", "announcement:read"],
        ),
    ];

    for (rid, perm_names) in &role_perms {
        for pname in perm_names {
            if let Some(pid) = perm_map.get(*pname) {
                let existing = role_permission::Entity::find()
                    .filter(role_permission::Column::RoleId.eq(**rid))
                    .filter(role_permission::Column::PermissionId.eq(*pid))
                    .one(db)
                    .await?;

                if existing.is_none() {
                    role_permission::ActiveModel {
                        role_id: sea_orm::ActiveValue::Set(**rid),
                        permission_id: sea_orm::ActiveValue::Set(*pid),
                    }
                    .insert(db)
                    .await?;
                }
            }
        }
    }

    Ok(())
}
