use std::marker::PhantomData;

use crate::domain::error::TransitionError;
use crate::entity::common::enrollment_batches;
use crate::entity::common::enums::BatchStatus;

pub enum Active {}
pub enum Locked {}

#[derive(Debug)]
pub struct EnrollmentBatchEntity<S> {
    pub model: enrollment_batches::Model,
    pub _state: PhantomData<S>,
}

impl<S> EnrollmentBatchEntity<S> {
    pub fn inner(&self) -> &enrollment_batches::Model {
        &self.model
    }

    pub fn into_inner(self) -> enrollment_batches::Model {
        self.model
    }
}

impl EnrollmentBatchEntity<Active> {
    pub fn from_model(model: enrollment_batches::Model) -> Self {
        EnrollmentBatchEntity {
            model,
            _state: PhantomData,
        }
    }

    /// Lock if batch is closed or archived
    pub fn lock_if_needed(self) -> Result<EnrollmentBatchEntity<Active>, TransitionError> {
        match self.model.status {
            BatchStatus::Open => Ok(self),
            _ => Err(TransitionError::EntityLocked {
                entity: "EnrollmentBatch".to_string(),
                id: self.model.id,
                status: format!("{:?}", self.model.status),
            }),
        }
    }

    pub fn force_lock(self) -> EnrollmentBatchEntity<Locked> {
        EnrollmentBatchEntity {
            model: self.model,
            _state: PhantomData,
        }
    }

    pub fn is_open(&self) -> bool {
        self.model.status == BatchStatus::Open
    }

    pub fn is_closed(&self) -> bool {
        self.model.status != BatchStatus::Open
    }

    pub fn applications_window_open(&self) -> bool {
        let now = chrono::Utc::now();
        self.model.status == BatchStatus::Open && self.model.closed_at > now
    }
}

impl EnrollmentBatchEntity<Locked> {
    pub fn unlock(self, force: bool) -> Result<EnrollmentBatchEntity<Active>, TransitionError> {
        if force {
            Ok(EnrollmentBatchEntity {
                model: self.model,
                _state: PhantomData,
            })
        } else {
            Err(TransitionError::EntityLocked {
                entity: "EnrollmentBatch".to_string(),
                id: self.model.id,
                status: format!("{:?}", self.model.status),
            })
        }
    }

    pub fn can_mutate(&self, force: bool) -> bool {
        force
    }
}

impl From<enrollment_batches::Model> for EnrollmentBatchEntity<Active> {
    fn from(model: enrollment_batches::Model) -> Self {
        EnrollmentBatchEntity::from_model(model)
    }
}
