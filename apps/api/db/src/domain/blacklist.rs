use std::marker::PhantomData;

use crate::entity::common::blacklist;

#[derive(Debug)]
pub enum Active {}
#[derive(Debug)]
pub enum Expired {}

#[derive(Debug)]
pub struct BlacklistEntry<S> {
    pub model: blacklist::Model,
    pub _state: PhantomData<S>,
}

impl<S> BlacklistEntry<S> {
    pub fn inner(&self) -> &blacklist::Model {
        &self.model
    }

    pub fn into_inner(self) -> blacklist::Model {
        self.model
    }
}

impl BlacklistEntry<Active> {
    pub fn from_model(model: blacklist::Model) -> Self {
        BlacklistEntry {
            model,
            _state: PhantomData,
        }
    }

    pub fn is_expired(&self) -> bool {
        chrono::Utc::now() > self.model.expires_at
    }

    pub fn expire(self) -> Result<BlacklistEntry<Expired>, super::error::TransitionError> {
        let mut model = self.model;
        model.status = "Expired".to_string();
        Ok(BlacklistEntry {
            model,
            _state: PhantomData,
        })
    }
}

impl BlacklistEntry<Expired> {
    pub fn model(&self) -> &blacklist::Model {
        &self.model
    }
}

impl From<blacklist::Model> for BlacklistEntry<Active> {
    fn from(model: blacklist::Model) -> Self {
        BlacklistEntry::from_model(model)
    }
}
