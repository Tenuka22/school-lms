use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let table = Table::alter()
            .table(EnrollmentBatches::Table)
            .add_column(ColumnDef::new(EnrollmentBatches::BuddhismWeight).small_integer().not_null().default(74))
            .add_column(ColumnDef::new(EnrollmentBatches::CatholicismWeight).small_integer().not_null().default(12))
            .add_column(ColumnDef::new(EnrollmentBatches::IslamWeight).small_integer().not_null().default(14))
            .add_column(ColumnDef::new(EnrollmentBatches::HinduismWeight).small_integer().not_null().default(0))
            .to_owned();

        manager.alter_table(table).await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let table = Table::alter()
            .table(EnrollmentBatches::Table)
            .drop_column(EnrollmentBatches::BuddhismWeight)
            .drop_column(EnrollmentBatches::CatholicismWeight)
            .drop_column(EnrollmentBatches::IslamWeight)
            .drop_column(EnrollmentBatches::HinduismWeight)
            .to_owned();

        manager.alter_table(table).await
    }
}

#[derive(Iden)]
enum EnrollmentBatches {
    Table,
    BuddhismWeight,
    CatholicismWeight,
    IslamWeight,
    HinduismWeight,
}
