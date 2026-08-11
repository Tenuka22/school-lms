use std::marker::PhantomData;

use crate::entity::common::enums::EnrollmentStatus;
use crate::entity::g1::applications;
use crate::domain::error::TransitionError;

#[derive(Debug)]
pub enum Active {}
#[derive(Debug)]
pub enum Locked {}

#[derive(Debug)]
pub struct G1ApplicationEntity<S> {
    pub model: applications::Model,
    pub _state: PhantomData<S>,
}

impl<S> G1ApplicationEntity<S> {
    pub fn inner(&self) -> &applications::Model {
        &self.model
    }

    pub fn into_inner(self) -> applications::Model {
        self.model
    }
}

impl G1ApplicationEntity<Active> {
    pub fn from_model(model: applications::Model) -> Self {
        G1ApplicationEntity {
            model,
            _state: PhantomData,
        }
    }

    /// Lock the entity if its status is non-editable
    pub fn lock_if_needed(self) -> Result<G1ApplicationEntity<Active>, TransitionError> {
        match self.model.enrollment_status {
            EnrollmentStatus::Draft | EnrollmentStatus::Pending | EnrollmentStatus::Completed => {
                Ok(self)
            }
            _ => Err(TransitionError::EntityLocked {
                entity: "G1Application".to_string(),
                id: self.model.id,
                status: format!("{:?}", self.model.enrollment_status),
            }),
        }
    }

    /// Force-lock regardless of status (admin override)
    pub fn force_lock(self) -> G1ApplicationEntity<Locked> {
        G1ApplicationEntity {
            model: self.model,
            _state: PhantomData,
        }
    }

    pub fn find_child(&self) -> uuid::Uuid {
        self.model.child_id
    }

    pub fn find_guardian(&self) -> uuid::Uuid {
        self.model.guardian_id
    }

    pub fn find_batch(&self) -> uuid::Uuid {
        self.model.batch_id
    }

    pub fn update_wizard_step(&mut self, step: i16) {
        self.model.wizard_step = Some(step);
        self.model.updated_at = chrono::Utc::now();
    }

    pub fn set_enrollment_status(&mut self, status: EnrollmentStatus) {
        self.model.enrollment_status = status;
        self.model.updated_at = chrono::Utc::now();
    }
}

impl G1ApplicationEntity<Locked> {
    /// Attempt to unlock — requires force flag from caller
    pub fn unlock(self, force: bool) -> Result<G1ApplicationEntity<Active>, TransitionError> {
        if force {
            Ok(G1ApplicationEntity {
                model: self.model,
                _state: PhantomData,
            })
        } else {
            Err(TransitionError::EntityLocked {
                entity: "G1Application".to_string(),
                id: self.model.id,
                status: format!("{:?}", self.model.enrollment_status),
            })
        }
    }

    /// Check if mutations are allowed
    pub fn can_mutate(&self, force: bool) -> bool {
        force
    }
}

impl From<applications::Model> for G1ApplicationEntity<Active> {
    fn from(model: applications::Model) -> Self {
        G1ApplicationEntity::from_model(model)
    }
}
