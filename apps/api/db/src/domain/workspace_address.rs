use std::marker::PhantomData;

use crate::entity::common::workspace_addresses;

#[derive(Debug)]
pub struct WorkspaceAddress<S> {
    pub model: workspace_addresses::Model,
    pub _state: PhantomData<S>,
}

#[derive(Debug)]
pub enum Active {}

impl<S> WorkspaceAddress<S> {
    pub fn inner(&self) -> &workspace_addresses::Model {
        &self.model
    }

    pub fn into_inner(self) -> workspace_addresses::Model {
        self.model
    }
}

impl WorkspaceAddress<Active> {
    pub fn from_model(model: workspace_addresses::Model) -> Self {
        WorkspaceAddress {
            model,
            _state: PhantomData,
        }
    }

    pub fn is_remote(&self) -> bool {
        self.model.name.to_lowercase().contains("remote")
            || self.model.name.to_lowercase().contains("work from home")
    }
}

impl From<workspace_addresses::Model> for WorkspaceAddress<Active> {
    fn from(model: workspace_addresses::Model) -> Self {
        WorkspaceAddress::from_model(model)
    }
}
