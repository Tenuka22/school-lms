use std::marker::PhantomData;

use crate::entity::common::addresses;
use crate::domain::error::TransitionError;

#[derive(Debug)]
pub enum Active {}
#[derive(Debug)]
pub enum Locked {}

#[derive(Debug)]
pub struct AddressEntity<S> {
    pub model: addresses::Model,
    pub _state: PhantomData<S>,
}

impl<S> AddressEntity<S> {
    pub fn inner(&self) -> &addresses::Model {
        &self.model
    }

    pub fn into_inner(self) -> addresses::Model {
        self.model
    }
}

impl AddressEntity<Active> {
    pub fn from_model(model: addresses::Model) -> Self {
        AddressEntity {
            model,
            _state: PhantomData,
        }
    }

    pub fn force_lock(self) -> AddressEntity<Locked> {
        AddressEntity {
            model: self.model,
            _state: PhantomData,
        }
    }

    pub fn is_verified(&self) -> bool {
        self.model.verified_by_map
    }
}

impl AddressEntity<Locked> {
    pub fn unlock(self, force: bool) -> Result<AddressEntity<Active>, TransitionError> {
        if force {
            Ok(AddressEntity {
                model: self.model,
                _state: PhantomData,
            })
        } else {
            Err(TransitionError::EntityLocked {
                entity: "Address".to_string(),
                id: self.model.id,
                status: "locked".to_string(),
            })
        }
    }

    pub fn can_mutate(&self, force: bool) -> bool {
        force
    }
}

impl From<addresses::Model> for AddressEntity<Active> {
    fn from(model: addresses::Model) -> Self {
        AddressEntity::from_model(model)
    }
}
