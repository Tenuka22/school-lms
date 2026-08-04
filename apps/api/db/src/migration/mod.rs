pub mod m20260803_000001_create_initial_schema;
pub mod m20260803_000002_add_religion_columns_to_enrollment_batches;
pub mod m20260804_000001_add_nic_passport_to_children;

use sea_orm_migration::prelude::*;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260803_000001_create_initial_schema::Migration),
            Box::new(m20260803_000002_add_religion_columns_to_enrollment_batches::Migration),
            Box::new(m20260804_000001_add_nic_passport_to_children::Migration),
        ]
    }
}
