use std::marker::PhantomData;

use crate::entity::common::enums::AppealStatus;
use crate::entity::g1::appeal_history;

pub enum Filed {}
pub enum UnderReview {}
pub enum ReEvaluated {}
pub enum Accepted {}
pub enum RejectedAppeal {}

pub struct Appeal<S> {
    pub model: appeal_history::Model,
    pub _state: PhantomData<S>,
}

impl<S> Appeal<S> {
    pub fn inner(&self) -> &appeal_history::Model {
        &self.model
    }

    pub fn into_inner(self) -> appeal_history::Model {
        self.model
    }
}

impl Appeal<Filed> {
    pub fn new(application_id: uuid::Uuid, appeal_type: String, reason: String) -> Self {
        let now = chrono::Utc::now();
        let model = appeal_history::Model {
            id: uuid::Uuid::new_v4(),
            application_id,
            appeal_reference: format!(
                "APL-{}",
                &uuid::Uuid::new_v4().to_string()[..8].to_uppercase()
            ),
            appeal_type,
            reason_text: reason,
            supporting_docs: None,
            status: AppealStatus::Filed,
            filed_at: now,
            reviewed_by: None,
            reviewed_at: None,
            original_marks: None,
            revised_marks: None,
            decision_reason: None,
        };
        Appeal {
            model,
            _state: PhantomData,
        }
    }

    pub fn start_review(self) -> Result<Appeal<UnderReview>, super::error::TransitionError> {
        let mut model = self.model;
        model.status = AppealStatus::UnderReview;
        Ok(Appeal {
            model,
            _state: PhantomData,
        })
    }
}

impl Appeal<UnderReview> {
    pub fn re_evaluate(self) -> Result<Appeal<ReEvaluated>, super::error::TransitionError> {
        let mut model = self.model;
        model.status = AppealStatus::ReEvaluated;
        Ok(Appeal {
            model,
            _state: PhantomData,
        })
    }
}

impl Appeal<ReEvaluated> {
    pub fn accept(
        self,
        reviewer_id: uuid::Uuid,
    ) -> Result<Appeal<Accepted>, super::error::TransitionError> {
        let mut model = self.model;
        model.status = AppealStatus::Accepted;
        model.reviewed_by = Some(reviewer_id);
        model.reviewed_at = Some(chrono::Utc::now());
        Ok(Appeal {
            model,
            _state: PhantomData,
        })
    }

    pub fn reject(
        self,
        reviewer_id: uuid::Uuid,
        reason: String,
    ) -> Result<Appeal<RejectedAppeal>, super::error::TransitionError> {
        let mut model = self.model;
        model.status = AppealStatus::Rejected;
        model.reviewed_by = Some(reviewer_id);
        model.reviewed_at = Some(chrono::Utc::now());
        model.decision_reason = Some(reason);
        Ok(Appeal {
            model,
            _state: PhantomData,
        })
    }
}
