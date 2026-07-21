use chrono::Utc;
use sea_orm::{ActiveModelTrait, DatabaseConnection, DbErr, EntityTrait, PaginatorTrait, Set};
use uuid::Uuid;

use crate::entity::common::enums::{SchoolCategory, SchoolType};
use crate::entity::common::schools;
use crate::entity::workspace_addresses;

pub async fn seed_schools(db: &DatabaseConnection) -> Result<(), DbErr> {
    let count = schools::Entity::find().count(db).await?;
    if count > 0 {
        return Ok(());
    }

    let now = Utc::now();
    schools::ActiveModel {
        id: Set(Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap()),
        school_name_si: Set("St. Aloysius College, Galle".to_string()),
        school_name_en: Set(Some("St. Aloysius College, Galle".to_string())),
        school_type: Set(SchoolType::OneAB),
        address: Set(Some("Galle, Sri Lanka".to_string())),
        district_id: Set(None),
        category: Set(SchoolCategory::Urban),
        grade_1_quota: Set(100),
        geo_latitude: Set(None),
        geo_longitude: Set(None),
        status: Set("Active".to_string()),
        created_at: Set(now),
    }
    .insert(db)
    .await?;

    log::info!("Seeded school: St. Aloysius College, Galle");

    Ok(())
}

pub async fn seed_workspace_addresses(db: &DatabaseConnection) -> Result<(), DbErr> {
    let count = workspace_addresses::Entity::find().count(db).await?;
    if count > 0 {
        return Ok(());
    }

    let now = Utc::now();
    workspace_addresses::ActiveModel {
        id: Set(Uuid::parse_str("00000000-0000-0000-0000-000000000101").unwrap()),
        name: Set("Remote / Work From Home".to_string()),
        building: Set(None),
        street_1: Set("Remote".to_string()),
        street_2: Set(None),
        city: Set("Remote".to_string()),
        state: Set(None),
        postal_code: Set(None),
        country: Set("Sri Lanka".to_string()),
        full_address: Set("Work from home / Remote location".to_string()),
        created_at: Set(now),
    }
    .insert(db)
    .await?;

    log::info!("Seeded workspace address: Remote / Work From Home");

    Ok(())
}
