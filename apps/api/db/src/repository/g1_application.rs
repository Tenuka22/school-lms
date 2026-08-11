use async_trait::async_trait;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

use crate::entity::g1::applications;

#[derive(Debug, Clone)]
pub struct ApplicationFilter {
    pub category: Option<String>,
    pub enrollment_status: Option<String>,
    pub batch_id: Option<Uuid>,
}

#[async_trait]
pub trait G1ApplicationRepo: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<applications::Model>, DbErr>;
    async fn find_active_by_id(&self, id: Uuid) -> Result<Option<applications::Model>, DbErr>;
    async fn insert(&self, model: applications::Model) -> Result<applications::Model, DbErr>;
    async fn update(&self, model: applications::Model) -> Result<applications::Model, DbErr>;
    async fn soft_delete(&self, id: Uuid) -> Result<(), DbErr>;
    async fn count_by_batch(&self, batch_id: Uuid) -> Result<u64, DbErr>;
    async fn list(
        &self,
        filter: ApplicationFilter,
        page: u64,
        page_size: u64,
    ) -> Result<(Vec<applications::Model>, u64), DbErr>;
}

pub struct SeaOrmG1ApplicationRepo<'a> {
    pub db: &'a DatabaseConnection,
}

#[async_trait]
impl<'a> G1ApplicationRepo for SeaOrmG1ApplicationRepo<'a> {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<applications::Model>, DbErr> {
        use sea_orm::EntityTrait;
        applications::Entity::find_by_id(id).one(self.db).await
    }

    async fn find_active_by_id(&self, id: Uuid) -> Result<Option<applications::Model>, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
        applications::Entity::find_by_id(id)
            .filter(applications::Column::DeletedAt.is_null())
            .one(self.db)
            .await
    }

    async fn insert(&self, model: applications::Model) -> Result<applications::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: applications::ActiveModel = model.into();
        active.insert(self.db).await
    }

    async fn update(&self, model: applications::Model) -> Result<applications::Model, DbErr> {
        use sea_orm::ActiveModelTrait;
        let active: applications::ActiveModel = model.into();
        active.update(self.db).await
    }

    async fn soft_delete(&self, id: Uuid) -> Result<(), DbErr> {
        use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
        use chrono::Utc;

        if let Some(existing) = applications::Entity::find_by_id(id)
            .filter(applications::Column::DeletedAt.is_null())
            .one(self.db)
            .await?
        {
            let active = applications::ActiveModel {
                id: Set(existing.id),
                reference_no: Set(existing.reference_no),
                school_id: Set(existing.school_id),
                total_marks: Set(existing.total_marks),
                rank_number: Set(existing.rank_number),
                list_category: Set(existing.list_category),
                submitted_at: Set(existing.submitted_at),
                verified_at: Set(existing.verified_at),
                verified_by: Set(existing.verified_by),
                finalized_at: Set(existing.finalized_at),
                ip_address: Set(existing.ip_address),
                user_agent: Set(existing.user_agent),
                created_at: Set(existing.created_at),
                updated_at: Set(Utc::now()),
                child_id: Set(existing.child_id),
                guardian_id: Set(existing.guardian_id),
                batch_id: Set(existing.batch_id),
                enrollment_status: Set(existing.enrollment_status),
                category: Set(existing.category),
                overseas_arrival_date: Set(existing.overseas_arrival_date),
                submission_method: Set(existing.submission_method),
                interview_date: Set(existing.interview_date),
                interview_completed: Set(existing.interview_completed),
                birth_certificate_verified: Set(existing.birth_certificate_verified),
                age_eligibility_verified: Set(existing.age_eligibility_verified),
                residence_verified: Set(existing.residence_verified),
                category_verified: Set(existing.category_verified),
                alternative_age_certificate: Set(existing.alternative_age_certificate),
                alternative_age_certificate_ref: Set(existing.alternative_age_certificate_ref),
                rejection_reason: Set(existing.rejection_reason),
                created_by: Set(existing.created_by),
                updated_by: Set(existing.updated_by),
                wizard_step: Set(existing.wizard_step),
                deleted_at: Set(Some(Utc::now())),
                preferred_school_ids: Set(existing.preferred_school_ids),
                electoral_year: Set(existing.electoral_year),
                polling_district: Set(existing.polling_district),
                polling_division: Set(existing.polling_division),
                gn_name: Set(existing.gn_name),
                gn_number: Set(existing.gn_number),
                polling_area: Set(existing.polling_area),
                village_street: Set(existing.village_street),
                voter_names: Set(existing.voter_names),
                household_head_name: Set(existing.household_head_name),
                declaration_agreed: Set(existing.declaration_agreed),
                declaration_signed_at: Set(existing.declaration_signed_at),
                closer_school_exists: Set(existing.closer_school_exists),
            };
            active.update(self.db).await?;
        }
        Ok(())
    }

    async fn count_by_batch(&self, batch_id: Uuid) -> Result<u64, DbErr> {
        use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter};
        applications::Entity::find()
            .filter(applications::Column::BatchId.eq(batch_id))
            .filter(applications::Column::DeletedAt.is_null())
            .count(self.db)
            .await
    }

    async fn list(
        &self,
        filter: ApplicationFilter,
        page: u64,
        page_size: u64,
    ) -> Result<(Vec<applications::Model>, u64), DbErr> {
        use sea_orm::{
            ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder,
        };

        let mut query = applications::Entity::find()
            .filter(applications::Column::DeletedAt.is_null());

        if let Some(ref category) = filter.category {
            if !category.is_empty() {
                query = query.filter(applications::Column::Category.eq(category.clone()));
            }
        }
        if let Some(ref status) = filter.enrollment_status {
            if !status.is_empty() {
                query = query.filter(applications::Column::EnrollmentStatus.eq(status.clone()));
            }
        }
        if let Some(batch_id) = filter.batch_id {
            query = query.filter(applications::Column::BatchId.eq(batch_id));
        }

        query = query.order_by(applications::Column::CreatedAt, sea_orm::Order::Desc);

        let paginator = query.paginate(self.db, page_size);
        let total = paginator.num_items().await?;
        let items = paginator.fetch_page(page).await?;
        Ok((items, total))
    }
}
