use db::entity::{counter, secure_counter};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter, Set,
};
use serde::Serialize;

pub enum CounterTarget {
    Normal,
    Secure,
}

#[derive(Serialize)]
pub struct CounterResponse {
    pub name: String,
    pub value: i32,
}

pub async fn get(
    db: &DatabaseConnection,
    name: &str,
    target: &CounterTarget,
) -> Result<CounterResponse, DbErr> {
    match target {
        CounterTarget::Normal => {
            if let Some(c) = counter::Entity::find()
                .filter(counter::Column::Name.eq(name))
                .one(db)
                .await?
            {
                return Ok(CounterResponse {
                    name: c.name,
                    value: c.value,
                });
            }
            counter::ActiveModel {
                name: Set(name.to_owned()),
                value: Set(0),
                ..Default::default()
            }
            .insert(db)
            .await
            .map(|c| CounterResponse {
                name: c.name,
                value: c.value,
            })
        }
        CounterTarget::Secure => {
            if let Some(c) = secure_counter::Entity::find()
                .filter(secure_counter::Column::Name.eq(name))
                .one(db)
                .await?
            {
                return Ok(CounterResponse {
                    name: c.name,
                    value: c.value,
                });
            }
            secure_counter::ActiveModel {
                name: Set(name.to_owned()),
                value: Set(0),
                ..Default::default()
            }
            .insert(db)
            .await
            .map(|c| CounterResponse {
                name: c.name,
                value: c.value,
            })
        }
    }
}

pub async fn increment(
    db: &DatabaseConnection,
    name: &str,
    target: &CounterTarget,
) -> Result<CounterResponse, DbErr> {
    match target {
        CounterTarget::Normal => {
            let c = counter::Entity::find()
                .filter(counter::Column::Name.eq(name))
                .one(db)
                .await?
                .ok_or_else(|| DbErr::Custom("counter not found".into()))?;
            let mut active: counter::ActiveModel = c.into();
            active.value = Set(active.value.unwrap() + 1);
            active.update(db).await.map(|c| CounterResponse {
                name: c.name,
                value: c.value,
            })
        }
        CounterTarget::Secure => {
            let c = secure_counter::Entity::find()
                .filter(secure_counter::Column::Name.eq(name))
                .one(db)
                .await?
                .ok_or_else(|| DbErr::Custom("secure counter not found".into()))?;
            let mut active: secure_counter::ActiveModel = c.into();
            active.value = Set(active.value.unwrap() + 1);
            active.update(db).await.map(|c| CounterResponse {
                name: c.name,
                value: c.value,
            })
        }
    }
}
