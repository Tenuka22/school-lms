use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ── Issue 3: Drop waiting_position and promoted_at from g1_applications ──
        // These already exist in admission_lists per-school; the application-level
        // copies were denormalized copies risking inconsistency.

        manager
            .alter_table(
                Table::alter()
                    .table(G1Applications::Table)
                    .drop_column(G1Applications::WaitingPosition)
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(G1Applications::Table)
                    .drop_column(G1Applications::PromotedAt)
                    .to_owned(),
            )
            .await?;

        // ── Issue 6: Migrate guardians.relationship_type from String → GuardianRelationship enum ──
        // First normalise any unexpected values to 'Guardian', then change column type.

        manager
            .exec_stmt(
                Query::update()
                    .table(Guardians::Table)
                    .value(
                        Guardians::RelationshipType,
                        Expr::cust("'Guardian'"),
                    )
                    .and_where(
                        Expr::col(Guardians::RelationshipType)
                            .is_not_in(["Father", "Mother", "Guardian"]),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Guardians::Table)
                    .modify_column(
                        ColumnDef::new(Guardians::RelationshipType)
                            .string_len(20)
                            .not_null()
                            .default("Guardian"),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Reverse Issue 3: re-add columns
        manager
            .alter_table(
                Table::alter()
                    .table(G1Applications::Table)
                    .add_column(
                        ColumnDef::new(G1Applications::WaitingPosition).small_integer(),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(G1Applications::Table)
                    .add_column(
                        ColumnDef::new(G1Applications::PromotedAt)
                            .timestamp_with_time_zone(),
                    )
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(Iden)]
enum G1Applications {
    Table,
    WaitingPosition,
    PromotedAt,
}

#[derive(Iden)]
enum Guardians {
    Table,
    RelationshipType,
}
