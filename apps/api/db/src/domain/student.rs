use std::marker::PhantomData;

use crate::entity::student::student;

#[derive(Debug)]
pub enum Active {}
#[derive(Debug)]
pub enum Graduated {}
#[derive(Debug)]
pub enum Removed {}

#[derive(Debug)]
pub struct Student<S> {
    pub model: student::Model,
    pub _state: PhantomData<S>,
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
