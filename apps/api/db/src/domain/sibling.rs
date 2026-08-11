use std::marker::PhantomData;

use crate::entity::common::siblings;

#[derive(Debug)]
pub enum Unverified {}
#[derive(Debug)]
pub enum VerifiedSibling {}

#[derive(Debug)]
pub struct Sibling<S> {
    pub model: siblings::Model,
    pub _state: PhantomData<S>,
}

impl<S> Sibling<S> {
    pub fn inner(&self) -> &siblings::Model {
        &self.model
    }

    pub fn into_inner(self) -> siblings::Model {
        self.model
    }
}

impl Sibling<Unverified> {
    pub fn from_model(model: siblings::Model) -> Self {
        Sibling {
            model,
            _state: PhantomData,
        }
    }

    pub fn verify(
        self,
        doc_url: String,
    ) -> Result<Sibling<VerifiedSibling>, super::error::TransitionError> {
        let mut model = self.model;
        model.verified = true;
        model.verification_doc = Some(doc_url);
        Ok(Sibling {
            model,
            _state: PhantomData,
        })
    }
}

impl Sibling<VerifiedSibling> {
    pub fn model(&self) -> &siblings::Model {
        &self.model
    }
}

impl From<siblings::Model> for Sibling<Unverified> {
    fn from(model: siblings::Model) -> Self {
        Sibling::from_model(model)
    }
}
