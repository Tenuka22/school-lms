use std::marker::PhantomData;

use crate::domain::error::TransitionError;
use crate::entity::common::guardians;

#[derive(Debug)]
pub enum Active {}
#[derive(Debug)]
pub enum Locked {}

#[derive(Debug)]
pub struct GuardianEntity<S> {
    pub model: guardians::Model,
    pub _state: PhantomData<S>,
}

impl<S> GuardianEntity<S> {
    pub fn inner(&self) -> &guardians::Model {
        &self.model
    }

    pub fn into_inner(self) -> guardians::Model {
        self.model
    }
}

impl GuardianEntity<Active> {
    pub fn from_model(model: guardians::Model) -> Self {
        GuardianEntity {
            model,
            _state: PhantomData,
        }
    }

    pub fn force_lock(self) -> GuardianEntity<Locked> {
        GuardianEntity {
            model: self.model,
            _state: PhantomData,
        }
    }

    pub fn find_student(&self) -> Option<uuid::Uuid> {
        self.model.student_id
    }
}

impl GuardianEntity<Locked> {
    pub fn unlock(self, force: bool) -> Result<GuardianEntity<Active>, TransitionError> {
        if force {
            Ok(GuardianEntity {
                model: self.model,
                _state: PhantomData,
            })
        } else {
            Err(TransitionError::EntityLocked {
                entity: "Guardian".to_string(),
                id: self.model.id,
                status: "locked".to_string(),
            })
        }
    }

    pub fn can_mutate(&self, force: bool) -> bool {
        force
    }
}

impl From<guardians::Model> for GuardianEntity<Active> {
    fn from(model: guardians::Model) -> Self {
        GuardianEntity::from_model(model)
    }
}
