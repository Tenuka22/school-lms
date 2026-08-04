use std::marker::PhantomData;

use crate::entity::common::enums::EnrollmentStatus;
use crate::entity::g1::applications;

pub enum Draft {}
pub enum WizardStep1 {}
pub enum WizardStep2 {}
pub enum WizardStep3 {}
pub enum WizardStep4 {}
pub enum WizardStep5 {}
pub enum WizardStep6 {}
pub enum Submitted {}
pub enum UnderVerification {}
pub enum Verified {}
pub enum Admitted {}
pub enum Rejected {}

pub struct G1Application<S> {
    pub model: applications::Model,
    _state: PhantomData<S>,
}

impl<S> G1Application<S> {
    pub fn inner(&self) -> &applications::Model {
        &self.model
    }

    pub fn into_inner(self) -> applications::Model {
        self.model
    }
}

impl G1Application<Draft> {
    pub fn new(batch_id: uuid::Uuid, reference_no: String) -> Self {
        let model = applications::Model {
            id: uuid::Uuid::new_v4(),
            reference_no,
            school_id: None,
            total_marks: None,
            rank_number: None,
            list_category: None,
            waiting_position: None,
            promoted_at: None,
            submitted_at: None,
            verified_at: None,
            verified_by: None,
            finalized_at: None,
            ip_address: None,
            user_agent: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            child_id: uuid::Uuid::nil(),
            guardian_id: uuid::Uuid::nil(),
            batch_id,
            enrollment_status: EnrollmentStatus::Draft,
            category: None,
            overseas_arrival_date: None,
            submission_method: None,
            interview_date: None,
            interview_completed: false,
            birth_certificate_verified: false,
            age_eligibility_verified: false,
            residence_verified: false,
            category_verified: false,
            alternative_age_certificate: false,
            alternative_age_certificate_ref: None,
            rejection_reason: None,
            created_by: None,
            updated_by: None,
            wizard_step: Some(1),
            deleted_at: None,
            preferred_school_ids: None,
            electoral_year: None,
            polling_district: None,
            gn_division: None,
            polling_area: None,
            voter_names: None,
            household_head_name: None,
            declaration_agreed: false,
            declaration_signed_at: None,
        };
        G1Application {
            model,
            _state: PhantomData,
        }
    }

    pub fn advance_to_step2(
        self,
    ) -> Result<G1Application<WizardStep2>, super::error::TransitionError> {
        if self.model.child_id == uuid::Uuid::nil() {
            return Err(super::error::TransitionError::MissingField("child_id"));
        }
        let mut model = self.model;
        model.wizard_step = Some(2);
        model.updated_at = chrono::Utc::now();
        Ok(G1Application {
            model,
            _state: PhantomData,
        })
    }
}

impl G1Application<WizardStep1> {
    pub fn advance_to_step2(
        self,
    ) -> Result<G1Application<WizardStep2>, super::error::TransitionError> {
        if self.model.child_id == uuid::Uuid::nil() {
            return Err(super::error::TransitionError::MissingField("child_id"));
        }
        let mut model = self.model;
        model.wizard_step = Some(2);
        model.updated_at = chrono::Utc::now();
        Ok(G1Application {
            model,
            _state: PhantomData,
        })
    }
}

impl G1Application<WizardStep2> {
    pub fn advance_to_step3(
        self,
    ) -> Result<G1Application<WizardStep3>, super::error::TransitionError> {
        let mut model = self.model;
        model.wizard_step = Some(3);
        model.updated_at = chrono::Utc::now();
        Ok(G1Application {
            model,
            _state: PhantomData,
        })
    }
}

impl G1Application<WizardStep3> {
    pub fn advance_to_step4(
        self,
    ) -> Result<G1Application<WizardStep4>, super::error::TransitionError> {
        if self.model.guardian_id == uuid::Uuid::nil() {
            return Err(super::error::TransitionError::MissingField(
                "guardian_id",
            ));
        }
        let mut model = self.model;
        model.wizard_step = Some(4);
        model.updated_at = chrono::Utc::now();
        Ok(G1Application {
            model,
            _state: PhantomData,
        })
    }
}

impl G1Application<WizardStep4> {
    pub fn advance_to_step5(
        self,
    ) -> Result<G1Application<WizardStep5>, super::error::TransitionError> {
        let mut model = self.model;
        model.wizard_step = Some(5);
        model.updated_at = chrono::Utc::now();
        Ok(G1Application {
            model,
            _state: PhantomData,
        })
    }
}

impl G1Application<WizardStep5> {
    pub fn advance_to_step6(
        self,
    ) -> Result<G1Application<WizardStep6>, super::error::TransitionError> {
        let mut model = self.model;
        model.wizard_step = Some(6);
        model.updated_at = chrono::Utc::now();
        Ok(G1Application {
            model,
            _state: PhantomData,
        })
    }
}

impl G1Application<WizardStep6> {
    pub fn submit(
        self,
    ) -> Result<G1Application<Submitted>, super::error::TransitionError> {
        if self.model.child_id == uuid::Uuid::nil() {
            return Err(super::error::TransitionError::MissingField("child_id"));
        }
        if self.model.guardian_id == uuid::Uuid::nil() {
            return Err(super::error::TransitionError::MissingField(
                "guardian_id",
            ));
        }
        if !self.model.declaration_agreed {
            return Err(super::error::TransitionError::MissingField(
                "declaration_agreed",
            ));
        }
        let mut model = self.model;
        model.submitted_at = Some(chrono::Utc::now());
        model.enrollment_status = EnrollmentStatus::Completed;
        model.wizard_step = None;
        model.updated_at = chrono::Utc::now();
        Ok(G1Application {
            model,
            _state: PhantomData,
        })
    }
}

impl G1Application<Submitted> {
    pub fn start_verification(
        self,
    ) -> Result<G1Application<UnderVerification>, super::error::TransitionError> {
        let mut model = self.model;
        model.enrollment_status = EnrollmentStatus::PendingApproval;
        model.updated_at = chrono::Utc::now();
        Ok(G1Application {
            model,
            _state: PhantomData,
        })
    }
}

impl G1Application<UnderVerification> {
    pub fn verify(
        self,
    ) -> Result<G1Application<Verified>, super::error::TransitionError> {
        if !self.model.birth_certificate_verified {
            return Err(super::error::TransitionError::MissingField(
                "birth_certificate_verified",
            ));
        }
        if !self.model.age_eligibility_verified {
            return Err(super::error::TransitionError::MissingField(
                "age_eligibility_verified",
            ));
        }
        if !self.model.residence_verified {
            return Err(super::error::TransitionError::MissingField(
                "residence_verified",
            ));
        }
        if !self.model.category_verified {
            return Err(super::error::TransitionError::MissingField(
                "category_verified",
            ));
        }
        let mut model = self.model;
        model.verified_at = Some(chrono::Utc::now());
        model.enrollment_status = EnrollmentStatus::Approved;
        model.updated_at = chrono::Utc::now();
        Ok(G1Application {
            model,
            _state: PhantomData,
        })
    }
}

impl G1Application<Verified> {
    pub fn admit(
        self,
    ) -> Result<G1Application<Admitted>, super::error::TransitionError> {
        let mut model = self.model;
        model.finalized_at = Some(chrono::Utc::now());
        model.enrollment_status = EnrollmentStatus::Admitted;
        model.updated_at = chrono::Utc::now();
        Ok(G1Application {
            model,
            _state: PhantomData,
        })
    }

    pub fn reject(
        self,
        reason: String,
    ) -> Result<G1Application<Rejected>, super::error::TransitionError> {
        let mut model = self.model;
        model.rejection_reason = Some(reason);
        model.finalized_at = Some(chrono::Utc::now());
        model.enrollment_status = EnrollmentStatus::Rejected;
        model.updated_at = chrono::Utc::now();
        Ok(G1Application {
            model,
            _state: PhantomData,
        })
    }
}
