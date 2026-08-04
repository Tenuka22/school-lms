use std::marker::PhantomData;

use crate::entity::student::student;

pub enum Active {}
pub enum Graduated {}
pub enum Removed {}

pub struct Student<S> {
    pub model: student::Model,
    _state: PhantomData<S>,
}

impl<S> Student<S> {
    pub fn inner(&self) -> &student::Model {
        &self.model
    }

    pub fn into_inner(self) -> student::Model {
        self.model
    }
}

impl Student<Active> {
    pub fn new(model: student::Model) -> Self {
        Student {
            model,
            _state: PhantomData,
        }
    }

    pub fn graduate(self) -> Result<Student<Graduated>, super::error::TransitionError> {
        Ok(Student {
            model: self.model,
            _state: PhantomData,
        })
    }

    pub fn remove(self) -> Result<Student<Removed>, super::error::TransitionError> {
        Ok(Student {
            model: self.model,
            _state: PhantomData,
        })
    }
}

impl Student<Graduated> {
    pub fn model(&self) -> &student::Model {
        &self.model
    }
}

impl Student<Removed> {
    pub fn model(&self) -> &student::Model {
        &self.model
    }
}
