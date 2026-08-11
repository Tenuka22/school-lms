use std::marker::PhantomData;

use crate::entity::common::staff_details;

#[derive(Debug)]
pub enum Current {}
#[derive(Debug)]
pub enum Former {}

#[derive(Debug)]
pub struct StaffDetail<S> {
    pub model: staff_details::Model,
    pub _state: PhantomData<S>,
}

impl<S> StaffDetail<S> {
    pub fn inner(&self) -> &staff_details::Model {
        &self.model
    }

    pub fn into_inner(self) -> staff_details::Model {
        self.model
    }
}

impl StaffDetail<Current> {
    pub fn from_model(model: staff_details::Model) -> Self {
        StaffDetail {
            model,
            _state: PhantomData,
        }
    }

    pub fn end_service(self) -> Result<StaffDetail<Former>, super::error::TransitionError> {
        let mut model = self.model;
        model.is_current = false;
        model.service_end_date = Some(chrono::Utc::now().date_naive());
        Ok(StaffDetail {
            model,
            _state: PhantomData,
        })
    }
}

impl StaffDetail<Former> {
    pub fn model(&self) -> &staff_details::Model {
        &self.model
    }
}

impl From<staff_details::Model> for StaffDetail<Current> {
    fn from(model: staff_details::Model) -> Self {
        StaffDetail::from_model(model)
    }
}
