use std::marker::PhantomData;

use crate::domain::error::TransitionError;
use crate::entity::student::student;

#[derive(Debug)]
pub enum Active {}
#[derive(Debug)]
pub enum Locked {}

#[derive(Debug)]
pub struct StudentEntity<S> {
    pub model: student::Model,
    pub _state: PhantomData<S>,
}

impl<S> StudentEntity<S> {
    pub fn inner(&self) -> &student::Model {
        &self.model
    }

    pub fn into_inner(self) -> student::Model {
        self.model
    }
}

impl StudentEntity<Active> {
    pub fn from_model(model: student::Model) -> Self {
        StudentEntity {
            model,
            _state: PhantomData,
        }
    }

    pub fn force_lock(self) -> StudentEntity<Locked> {
        StudentEntity {
            model: self.model,
            _state: PhantomData,
        }
    }
}

impl StudentEntity<Locked> {
    pub fn unlock(self, force: bool) -> Result<StudentEntity<Active>, TransitionError> {
        if force {
            Ok(StudentEntity {
                model: self.model,
                _state: PhantomData,
            })
        } else {
            Err(TransitionError::EntityLocked {
                entity: "Student".to_string(),
                id: self.model.id,
                status: "locked".to_string(),
            })
        }
    }

    pub fn can_mutate(&self, force: bool) -> bool {
        force
    }
}

impl From<student::Model> for StudentEntity<Active> {
    fn from(model: student::Model) -> Self {
        StudentEntity::from_model(model)
    }
}
