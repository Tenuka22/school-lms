use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Step 1: Add child_id column to students table (nullable initially)
        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .add_column(ColumnDef::new(Students::ChildId).uuid())
                    .to_owned(),
            )
            .await?;

        // Step 2: Migrate existing data - set child_id from children.student_id
        // Uses a correlated subquery since cross-table UPDATE isn't supported by sea_query builder
        manager
            .exec_stmt(
                Query::update()
                    .table(Students::Table)
                    .value(
                        Students::ChildId,
                        Expr::cust(
                            r#"(SELECT "id" FROM "children" WHERE "student_id" = "students"."id" LIMIT 1)"#,
                        ),
                    )
                    .to_owned(),
            )
            .await?;

        // Step 3: Remove orphan students that couldn't be linked to a child
        // These are invalid under the new model (every student must have a child)
        manager
            .exec_stmt(
                Query::delete()
                    .from_table(Students::Table)
                    .and_where(Expr::col(Students::ChildId).is_null())
                    .to_owned(),
            )
            .await?;

        // Step 4: Make child_id NOT NULL after data migration
        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .modify_column(ColumnDef::new(Students::ChildId).uuid().not_null())
                    .to_owned(),
            )
            .await?;

        // Step 5: Add unique constraint on child_id
        manager
            .create_index(
                Index::create()
                    .name("idx_students_child_id_unique")
                    .table(Students::Table)
                    .col(Students::ChildId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        // Step 6: Add foreign key from students.child_id to children.id
        manager
            .create_foreign_key(
                ForeignKey::create()
                    .name("fk_students_child")
                    .from(Students::Table, Students::ChildId)
                    .to(Children::Table, Children::Id)
                    .on_update(ForeignKeyAction::Cascade)
                    .on_delete(ForeignKeyAction::Cascade)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Drop the foreign key first
        manager
            .drop_foreign_key(
                ForeignKey::drop()
                    .name("fk_students_child")
                    .table(Students::Table)
                    .to_owned(),
            )
            .await?;

        // Drop the index
        manager
            .drop_index(
                Index::drop()
                    .name("idx_students_child_id_unique")
                    .table(Students::Table)
                    .to_owned(),
            )
            .await?;

        // Drop the column
        manager
            .alter_table(
                Table::alter()
                    .table(Students::Table)
                    .drop_column(Students::ChildId)
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
    ChildId,
}

#[derive(Iden)]
enum Children {
    Table,
    Id,
    StudentId,
}
