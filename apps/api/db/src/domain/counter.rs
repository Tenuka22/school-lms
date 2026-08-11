use std::marker::PhantomData;

use crate::entity::common::counter;

#[derive(Debug)]
pub struct Counter<S> {
    pub model: counter::Model,
    pub _state: PhantomData<S>,
}

#[derive(Debug)]
pub enum Normal {}

impl<S> Counter<S> {
    pub fn inner(&self) -> &counter::Model {
        &self.model
    }

    pub fn into_inner(self) -> counter::Model {
        self.model
    }
}

impl Counter<Normal> {
    pub fn from_model(model: counter::Model) -> Self {
        Counter {
            model,
            _state: PhantomData,
        }
    }

    pub fn current_value(&self) -> i32 {
        self.model.value
    }

    pub fn next_value(&mut self) -> i32 {
        self.model.value += 1;
        self.model.value
    }
}

impl From<counter::Model> for Counter<Normal> {
    fn from(model: counter::Model) -> Self {
        Counter::from_model(model)
    }
}
