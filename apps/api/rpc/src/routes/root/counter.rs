use actix_web::{HttpResponse, Responder, web};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use serde::Serialize;

use db::entity::counter;

#[derive(Serialize)]
struct CounterResponse {
    name: String,
    value: i32,
}

async fn find_or_create_counter(
    db: &sea_orm::DatabaseConnection,
    name: &str,
) -> Result<counter::Model, sea_orm::DbErr> {
    if let Some(c) = counter::Entity::find()
        .filter(counter::Column::Name.eq(name))
        .one(db)
        .await?
    {
        return Ok(c);
    }

    let active = counter::ActiveModel {
        name: Set(name.to_owned()),
        value: Set(0),
        ..Default::default()
    };
    active.insert(db).await
}

pub async fn get_counter(
    data: web::Data<sea_orm::DatabaseConnection>,
    name: web::Path<String>,
) -> impl Responder {
    let db = data.as_ref();
    let name = name.into_inner();

    match find_or_create_counter(db, &name).await {
        Ok(c) => HttpResponse::Ok().json(CounterResponse {
            name: c.name,
            value: c.value,
        }),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}

pub async fn increment_counter(
    data: web::Data<sea_orm::DatabaseConnection>,
    name: web::Path<String>,
) -> impl Responder {
    let db = data.as_ref();
    let name = name.into_inner();

    let c = match find_or_create_counter(db, &name).await {
        Ok(c) => c,
        Err(e) => return HttpResponse::InternalServerError().body(e.to_string()),
    };

    let mut active: counter::ActiveModel = c.into();
    active.value = Set(active.value.unwrap() + 1);
    match active.update(db).await {
        Ok(updated) => HttpResponse::Ok().json(CounterResponse {
            name: updated.name,
            value: updated.value,
        }),
        Err(e) => HttpResponse::InternalServerError().body(e.to_string()),
    }
}
