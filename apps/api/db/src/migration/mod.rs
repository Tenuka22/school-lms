pub mod m20260803_000001_create_initial_schema;

use sea_orm_migration::prelude::*;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![Box::new(m20260803_000001_create_initial_schema::Migration)]
    }
}
