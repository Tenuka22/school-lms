use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // children table
        let alter_children = Table::alter()
            .table(Children::Table)
            .add_column(ColumnDef::new(Children::NameWithInitialsEn).string().null())
            .to_owned();
        manager.alter_table(alter_children).await?;

        // g1_applications table
        let alter_apps = Table::alter()
            .table(G1Applications::Table)
            .add_column(
                ColumnDef::new(G1Applications::PreferredSchoolIds)
                    .json()
                    .null(),
            )
            .add_column(
                ColumnDef::new(G1Applications::ElectoralYear)
                    .small_integer()
                    .null(),
            )
            .add_column(
                ColumnDef::new(G1Applications::PollingDistrict)
                    .string()
                    .null(),
            )
            .add_column(ColumnDef::new(G1Applications::GnDivision).string().null())
            .add_column(ColumnDef::new(G1Applications::PollingArea).string().null())
            .add_column(ColumnDef::new(G1Applications::VoterNames).json().null())
            .add_column(
                ColumnDef::new(G1Applications::HouseholdHeadName)
                    .string()
                    .null(),
            )
            .add_column(
                ColumnDef::new(G1Applications::DeclarationAgreed)
                    .boolean()
                    .not_null()
                    .default(false),
            )
            .add_column(
                ColumnDef::new(G1Applications::DeclarationSignedAt)
                    .timestamp_with_time_zone()
                    .null(),
            )
            .to_owned();
        manager.alter_table(alter_apps).await?;

        // guardians table
        let alter_guardians = Table::alter()
            .table(Guardians::Table)
            .add_column(
                ColumnDef::new(Guardians::IsSriLankanCitizen)
                    .boolean()
                    .null(),
            )
            .to_owned();
        manager.alter_table(alter_guardians).await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let alter_guardians = Table::alter()
            .table(Guardians::Table)
            .drop_column(Guardians::IsSriLankanCitizen)
            .to_owned();
        manager.alter_table(alter_guardians).await?;

        let alter_apps = Table::alter()
            .table(G1Applications::Table)
            .drop_column(G1Applications::PreferredSchoolIds)
            .drop_column(G1Applications::ElectoralYear)
            .drop_column(G1Applications::PollingDistrict)
            .drop_column(G1Applications::GnDivision)
            .drop_column(G1Applications::PollingArea)
            .drop_column(G1Applications::VoterNames)
            .drop_column(G1Applications::HouseholdHeadName)
            .drop_column(G1Applications::DeclarationAgreed)
            .drop_column(G1Applications::DeclarationSignedAt)
            .to_owned();
        manager.alter_table(alter_apps).await?;

        let alter_children = Table::alter()
            .table(Children::Table)
            .drop_column(Children::NameWithInitialsEn)
            .to_owned();
        manager.alter_table(alter_children).await
    }
}

#[derive(Iden)]
enum Children {
    Table,
    NameWithInitialsEn,
}

#[derive(Iden)]
enum G1Applications {
    Table,
    PreferredSchoolIds,
    ElectoralYear,
    PollingDistrict,
    GnDivision,
    PollingArea,
    VoterNames,
    HouseholdHeadName,
    DeclarationAgreed,
    DeclarationSignedAt,
}

#[derive(Iden)]
enum Guardians {
    Table,
    IsSriLankanCitizen,
}
