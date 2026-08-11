use std::marker::PhantomData;

use crate::entity::common::guardians;

#[derive(Debug)]
pub enum Unverified {}
#[derive(Debug)]
pub enum Verified {}

#[derive(Debug)]
pub struct Guardian<S> {
    pub model: guardians::Model,
    pub _state: PhantomData<S>,
}

impl<S> Guardian<S> {
    pub fn inner(&self) -> &guardians::Model {
        &self.model
    }

    pub fn into_inner(self) -> guardians::Model {
        self.model
    }
}

impl Guardian<Unverified> {
    pub fn from_model(model: guardians::Model) -> Self {
        Guardian {
            model,
            _state: PhantomData,
        }
    }

    pub fn verify(self) -> Result<Guardian<Verified>, super::error::TransitionError> {
        let mut model = self.model;
        model.past_pupil_verified = true;
        Ok(Guardian {
            model,
            _state: PhantomData,
        })
    }

    pub fn is_govt_employee(&self) -> bool {
        self.model.is_govt_employee
    }

    pub fn is_school_staff(&self) -> bool {
        self.model.is_school_staff
    }

    pub fn is_past_pupil(&self) -> bool {
        self.model.is_past_pupil
    }
}

impl Guardian<Verified> {
    pub fn model(&self) -> &guardians::Model {
        &self.model
    }
}

impl From<guardians::Model> for Guardian<Unverified> {
    fn from(model: guardians::Model) -> Self {
        Guardian::from_model(model)
    }
}
