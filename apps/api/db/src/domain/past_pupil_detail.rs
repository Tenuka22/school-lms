use std::marker::PhantomData;

use crate::entity::common::past_pupil_details;

#[derive(Debug)]
pub enum Unverified {}
#[derive(Debug)]
pub enum VerifiedPastPupil {}

#[derive(Debug)]
pub struct PastPupilDetail<S> {
    pub model: past_pupil_details::Model,
    pub _state: PhantomData<S>,
}

impl<S> PastPupilDetail<S> {
    pub fn inner(&self) -> &past_pupil_details::Model {
        &self.model
    }

    pub fn into_inner(self) -> past_pupil_details::Model {
        self.model
    }
}

impl PastPupilDetail<Unverified> {
    pub fn from_model(model: past_pupil_details::Model) -> Self {
        PastPupilDetail {
            model,
            _state: PhantomData,
        }
    }

    pub fn verify(
        self,
        method: String,
    ) -> Result<PastPupilDetail<VerifiedPastPupil>, super::error::TransitionError> {
        let mut model = self.model;
        model.verified = true;
        model.verification_method = Some(method);
        Ok(PastPupilDetail {
            model,
            _state: PhantomData,
        })
    }
}

impl PastPupilDetail<VerifiedPastPupil> {
    pub fn model(&self) -> &past_pupil_details::Model {
        &self.model
    }
}

impl From<past_pupil_details::Model> for PastPupilDetail<Unverified> {
    fn from(model: past_pupil_details::Model) -> Self {
        PastPupilDetail::from_model(model)
    }
}
