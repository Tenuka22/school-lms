use std::marker::PhantomData;

use crate::entity::common::schools;

#[derive(Debug)]
pub enum Active {}
#[derive(Debug)]
pub enum Inactive {}

#[derive(Debug)]
pub struct School<S> {
    pub model: schools::Model,
    pub _state: PhantomData<S>,
}

impl<S> School<S> {
    pub fn inner(&self) -> &schools::Model {
        &self.model
    }

    pub fn into_inner(self) -> schools::Model {
        self.model
    }
}

impl School<Active> {
    pub fn from_model(model: schools::Model) -> Self {
        School {
            model,
            _state: PhantomData,
        }
    }

    pub fn deactivate(self) -> Result<School<Inactive>, super::error::TransitionError> {
        let mut model = self.model;
        model.status = "Inactive".to_string();
        Ok(School {
            model,
            _state: PhantomData,
        })
    }

    pub fn has_quota(&self) -> bool {
        self.model.grade_1_quota > 0
    }

    pub fn quota_remaining(&self, used: i32) -> i32 {
        (self.model.grade_1_quota - used).max(0)
    }
}

impl School<Inactive> {
    pub fn reactivate(self) -> Result<School<Active>, super::error::TransitionError> {
        let mut model = self.model;
        model.status = "Active".to_string();
        Ok(School {
            model,
            _state: PhantomData,
        })
    }

    pub fn model(&self) -> &schools::Model {
        &self.model
    }
}

impl From<schools::Model> for School<Active> {
    fn from(model: schools::Model) -> Self {
        School::from_model(model)
    }
}
