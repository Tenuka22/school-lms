use std::marker::PhantomData;

use crate::domain::error::TransitionError;
use crate::entity::common::enums::StudentStatus;
use crate::entity::g1::children;

pub enum Active {}
pub enum Locked {}

#[derive(Debug)]
pub struct ChildEntity<S> {
    pub model: children::Model,
    pub _state: PhantomData<S>,
}

impl<S> ChildEntity<S> {
    pub fn inner(&self) -> &children::Model {
        &self.model
    }

    pub fn into_inner(self) -> children::Model {
        self.model
    }
}

impl ChildEntity<Active> {
    pub fn from_model(model: children::Model) -> Self {
        ChildEntity {
            model,
            _state: PhantomData,
        }
    }

    /// Lock if student status is non-editable
    pub fn lock_if_needed(self) -> Result<ChildEntity<Active>, TransitionError> {
        match self.model.status {
            StudentStatus::Active => Ok(self),
            _ => Err(TransitionError::EntityLocked {
                entity: "Child".to_string(),
                id: self.model.id,
                status: format!("{:?}", self.model.status),
            }),
        }
    }

    pub fn force_lock(self) -> ChildEntity<Locked> {
        ChildEntity {
            model: self.model,
            _state: PhantomData,
        }
    }

    pub fn find_student(&self) -> Option<uuid::Uuid> {
        self.model.student_id
    }
}

impl ChildEntity<Locked> {
    pub fn unlock(self, force: bool) -> Result<ChildEntity<Active>, TransitionError> {
        if force {
            Ok(ChildEntity {
                model: self.model,
                _state: PhantomData,
            })
        } else {
            Err(TransitionError::EntityLocked {
                entity: "Child".to_string(),
                id: self.model.id,
                status: format!("{:?}", self.model.status),
            })
        }
    }

    pub fn can_mutate(&self, force: bool) -> bool {
        force
    }
}

impl From<children::Model> for ChildEntity<Active> {
    fn from(model: children::Model) -> Self {
        ChildEntity::from_model(model)
    }
}
