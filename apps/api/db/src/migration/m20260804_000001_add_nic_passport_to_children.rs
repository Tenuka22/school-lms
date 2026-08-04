use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Add nic and passport_number columns to children table
        let alter_table = Table::alter()
            .table(Children::Table)
            .add_column(ColumnDef::new(Children::Nic).string().unique_key())
            .add_column(ColumnDef::new(Children::PassportNumber).string().unique_key())
            .to_owned();

        manager.alter_table(alter_table).await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let alter_table = Table::alter()
            .table(Children::Table)
            .drop_column(Children::Nic)
            .drop_column(Children::PassportNumber)
            .to_owned();

        manager.alter_table(alter_table).await
    }
}

#[derive(Iden)]
enum Children {
    Table,
    Nic,
    PassportNumber,
}
