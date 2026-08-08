use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Step 1: Add student-only columns to children table
        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .add_column(ColumnDef::new(Children::AdmissionNumber).string().unique_key())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .add_column(ColumnDef::new(Children::AdmissionDate).date())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .add_column(ColumnDef::new(Children::CurrentGrade).small_integer())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .add_column(ColumnDef::new(Children::Phone).string())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .add_column(ColumnDef::new(Children::Email).string())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .add_column(ColumnDef::new(Children::Status).string().not_null().default("Active"))
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .add_column(
                        ColumnDef::new(Children::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null()
                            .default(Expr::current_timestamp()),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .add_column(ColumnDef::new(Children::CreatedBy).uuid())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .add_column(ColumnDef::new(Children::UpdatedBy).uuid())
                    .to_owned(),
            )
            .await?;

        // Step 2: Drop duplicated personal columns from students table
        // These columns are now served through children table via child_id FK
        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::FullName)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::NameWithInitials)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::DateOfBirth)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::Gender)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::BirthCertificateNumber)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::Nic)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::PassportNumber)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::Nationality)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::Religion)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::MediumOfInstruction)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::Phone)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::Email)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::Status)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::AdmissionDate)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::CurrentGrade)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::UpdatedAt)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::CreatedBy)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::UpdatedBy)
                    .to_owned(),
            )
            .await?;

        // Step 3: Also drop admission_number from students (moved to children)
        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::AdmissionNumber)
                    .to_owned(),
            )
            .await?;

        // Step 4: Drop existing FK and recreate with CASCADE on delete
        // First drop the old FK
        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .name("fk_children_student")
                    .table(Children::Table)
                    .to_owned(),
            )
            .await?;

        // Make student_id NOT NULL (required) with a default UUID
        // Note: We can't easily add a NOT NULL constraint with a default via alter_table in SeaORM
        // The existing NULL rows would need to be handled manually or we leave it as Optional
        // For now, keep it Optional but the new code will always set it

        // Recreate the FK with CASCADE on delete so when a student is deleted, the child record is cleaned up
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_children_student")
                    .from(Children::Table, Children::StudentId)
                    .to(Students::Table, Students::Id)
                    .on_update(ForeignKeyAction::Cascade)
                    .on_delete(ForeignKeyAction::Cascade)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Reverse migration - restore student columns, remove children columns

        // Drop the FK first
        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .name("fk_children_student")
                    .table(Children::Table)
                    .to_owned(),
            )
            .await?;

        // Restore student columns
        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::AdmissionNumber).string().unique_key())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::FullName).string().not_null())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::NameWithInitials).string().not_null())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::DateOfBirth).date().not_null())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::Gender).string().not_null())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::BirthCertificateNumber).string().unique_key())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::Nic).string().unique_key())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::PassportNumber).string().unique_key())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::Nationality).string().not_null())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::Religion).string())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::MediumOfInstruction).string().not_null())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::Phone).string())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::Email).string())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::Status).string().not_null())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::AdmissionDate).date())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::CurrentGrade).small_integer())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(
                        ColumnDef::new(Students::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::CreatedBy).uuid())
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::UpdatedBy).uuid())
                    .to_owned(),
            )
            .await?;

        // Remove student-only columns from children
        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .drop_column(Children::AdmissionNumber)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .drop_column(Children::AdmissionDate)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .drop_column(Children::CurrentGrade)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .drop_column(Children::Phone)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .drop_column(Children::Email)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .drop_column(Children::Status)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .drop_column(Children::UpdatedAt)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .drop_column(Children::CreatedBy)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Children::Table)
                    .drop_column(Children::UpdatedBy)
                    .to_owned(),
            )
            .await?;

        // Recreate original FK with SetNull on delete
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_children_student")
                    .from(Children::Table, Children::StudentId)
                    .to(Students::Table, Students::Id)
                    .on_update(ForeignKeyAction::Cascade)
                    .on_delete(ForeignKeyAction::SetNull)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(Iden)]
enum Students {
    Table,
    Id,
    AdmissionNumber,
    FullName,
    NameWithInitials,
    DateOfBirth,
    Gender,
    BirthCertificateNumber,
    Nic,
    PassportNumber,
    Nationality,
    Religion,
    MediumOfInstruction,
    Phone,
    Email,
    Status,
    AdmissionDate,
    CurrentGrade,
    UpdatedAt,
    CreatedBy,
    UpdatedBy,
}

#[derive(Iden)]
enum Children {
    Table,
    Id,
    StudentId,
    AdmissionNumber,
    AdmissionDate,
    CurrentGrade,
    Phone,
    Email,
    Status,
    UpdatedAt,
    CreatedBy,
    UpdatedBy,
}
