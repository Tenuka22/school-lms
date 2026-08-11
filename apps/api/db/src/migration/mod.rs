pub mod m20260803_000001_create_initial_schema;
pub mod m20260803_000002_add_religion_columns_to_enrollment_batches;
pub mod m20260804_000001_add_nic_passport_to_children;
pub mod m20260804_000002_add_circular_fields;
pub mod m20260805_000001_add_electoral_fields;
pub mod m20260805_000002_split_gn_division;
pub mod m20260806_000001_add_closer_school_exists;
pub mod m20260808_000001_deduplicate_student_child;
pub mod m20260808_000002_cleanup_dupes;
pub mod m20260810_000001_add_child_id_to_students;

use sea_orm_migration::prelude::*;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260803_000001_create_initial_schema::Migration),
            Box::new(m20260803_000002_add_religion_columns_to_enrollment_batches::Migration),
            Box::new(m20260804_000001_add_nic_passport_to_children::Migration),
            Box::new(m20260804_000002_add_circular_fields::Migration),
            Box::new(m20260805_000001_add_electoral_fields::Migration),
            Box::new(m20260805_000002_split_gn_division::Migration),
            Box::new(m20260806_000001_add_closer_school_exists::Migration),
            Box::new(m20260808_000001_deduplicate_student_child::Migration),
            Box::new(m20260808_000002_cleanup_dupes::Migration),
            Box::new(m20260810_000001_add_child_id_to_students::Migration),
        ]
    }
}
