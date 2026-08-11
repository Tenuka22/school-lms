use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let alter_apps = Table::alter()
            .table(G1Applications::Table)
            .add_column(
                ColumnDef::new(G1Applications::CloserSchoolExists)
                    .boolean()
                    .null(),
            )
            .to_owned();
        manager.alter_table(alter_apps).await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let alter_apps = Table::alter()
            .table(G1Applications::Table)
            .drop_column(G1Applications::CloserSchoolExists)
            .to_owned();
        manager.alter_table(alter_apps).await
    }
}

#[derive(Iden)]
enum G1Applications {
    Table,
    CloserSchoolExists,
}
