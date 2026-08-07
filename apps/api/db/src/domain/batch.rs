use std::marker::PhantomData;

use crate::entity::common::enums::BatchStatus;
use crate::entity::common::enrollment_batches;

pub enum Open {}
pub enum Closed {}
pub enum ListsPublished {}
pub enum AppealsPeriod {}
pub enum Archived {}

pub struct Batch<S> {
    pub model: enrollment_batches::Model,
    pub _state: PhantomData<S>,
}

impl<S> Batch<S> {
    pub fn inner(&self) -> &enrollment_batches::Model {
        &self.model
    }

    pub fn into_inner(self) -> enrollment_batches::Model {
        self.model
    }
}

impl Batch<Open> {
    pub fn new(year: i16, batch_code: String, batch_name: String) -> Self {
        let now = chrono::Utc::now();
        let model = enrollment_batches::Model {
            id: uuid::Uuid::new_v4(),
            year,
            batch_code,
            batch_name,
            enrollment_type: crate::entity::common::enums::EnrollmentType::G1,
            status: BatchStatus::Open,
            opened_at: now,
            closed_at: chrono::DateTime::from(now + chrono::Duration::days(365)),
            list_published_at: None,
            appeal_deadline_at: None,
            finalized_at: None,
            created_at: now,
            created_by: None,
            student_allocation: 200,
            proximity_percentage: 50,
            staff_percentage: 25,
            sibling_percentage: 14,
            alumni_percentage: 6,
            govt_percentage: 4,
            special_percentage: 1,
            buddhism_percentage: 74,
            catholicism_percentage: 12,
            islam_percentage: 14,
            hinduism_percentage: 0,
            waiting_list_size: 20,
        };
        Batch {
            model,
            _state: PhantomData,
        }
    }

    pub fn close(self) -> Result<Batch<Closed>, super::error::TransitionError> {
        let mut model = self.model;
        model.status = BatchStatus::Closed;
        model.closed_at = chrono::Utc::now();
        Ok(Batch {
            model,
            _state: PhantomData,
        })
    }
}

impl Batch<Closed> {
    pub fn publish_lists(self) -> Result<Batch<ListsPublished>, super::error::TransitionError> {
        let mut model = self.model;
        model.status = BatchStatus::ListsPublished;
        model.list_published_at = Some(chrono::Utc::now());
        Ok(Batch {
            model,
            _state: PhantomData,
        })
    }
}

impl Batch<ListsPublished> {
    pub fn open_appeals(
        self,
        deadline: chrono::DateTime<chrono::Utc>,
    ) -> Result<Batch<AppealsPeriod>, super::error::TransitionError> {
        let mut model = self.model;
        model.status = BatchStatus::AppealsPeriod;
        model.appeal_deadline_at = Some(deadline);
        Ok(Batch {
            model,
            _state: PhantomData,
        })
    }
}

impl Batch<AppealsPeriod> {
    pub fn archive(self) -> Result<Batch<Archived>, super::error::TransitionError> {
        let mut model = self.model;
        model.status = BatchStatus::Archived;
        model.finalized_at = Some(chrono::Utc::now());
        Ok(Batch {
            model,
            _state: PhantomData,
        })
    }
}
