use std::marker::PhantomData;

use crate::entity::common::addresses;

#[derive(Debug)]
pub enum Unverified {}
#[derive(Debug)]
pub enum VerifiedByMap {}

#[derive(Debug)]
pub struct Address<S> {
    pub model: addresses::Model,
    pub _state: PhantomData<S>,
}

impl<S> Address<S> {
    pub fn inner(&self) -> &addresses::Model {
        &self.model
    }

    pub fn into_inner(self) -> addresses::Model {
        self.model
    }
}

impl Address<Unverified> {
    pub fn from_model(model: addresses::Model) -> Self {
        Address {
            model,
            _state: PhantomData,
        }
    }

    pub fn verify_by_map(self) -> Result<Address<VerifiedByMap>, super::error::TransitionError> {
        let mut model = self.model;
        model.verified_by_map = true;
        Ok(Address {
            model,
            _state: PhantomData,
        })
    }
}

impl Address<VerifiedByMap> {
    pub fn model(&self) -> &addresses::Model {
        &self.model
    }
}

impl From<addresses::Model> for Address<Unverified> {
    fn from(model: addresses::Model) -> Self {
        Address::from_model(model)
    }
}
