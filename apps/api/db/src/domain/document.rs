use std::marker::PhantomData;

use crate::entity::common::enums::{DocumentVerificationStatus, G1DocumentType};
use crate::entity::g1::documents;

#[derive(Debug)]
pub enum Uploaded {}
#[derive(Debug)]
pub enum UnderReview {}
#[derive(Debug)]
pub enum VerifiedDoc {}
#[derive(Debug)]
pub enum RejectedDoc {}
#[derive(Debug)]
pub enum Flagged {}

#[derive(Debug)]
pub struct Document<S> {
    pub model: documents::Model,
    pub _state: PhantomData<S>,
}

impl<S> Document<S> {
    pub fn inner(&self) -> &documents::Model {
        &self.model
    }

    pub fn into_inner(self) -> documents::Model {
        self.model
    }
}

impl Document<Uploaded> {
    pub fn new(
        application_id: uuid::Uuid,
        document_type: G1DocumentType,
        file_url: String,
        file_key: String,
    ) -> Self {
        let now = chrono::Utc::now();
        let model = documents::Model {
            id: uuid::Uuid::new_v4(),
            application_id,
            document_type,
            file_url,
            file_key,
            file_hash: None,
            file_size: None,
            content_type: None,
            uploaded_at: now,
            verification_status: DocumentVerificationStatus::Pending,
            verified_by: None,
            verified_at: None,
            rejection_reason: None,
            fraud_flag: false,
            created_at: now,
            updated_at: now,
        };
        Document {
            model,
            _state: PhantomData,
        }
    }

    pub fn start_review(self) -> Result<Document<UnderReview>, super::error::TransitionError> {
        Ok(Document {
            model: self.model,
            _state: PhantomData,
        })
    }
}

impl Document<UnderReview> {
    pub fn verify(
        self,
        verifier_id: uuid::Uuid,
    ) -> Result<Document<VerifiedDoc>, super::error::TransitionError> {
        let mut model = self.model;
        model.verification_status = DocumentVerificationStatus::Verified;
        model.verified_by = Some(verifier_id);
        model.verified_at = Some(chrono::Utc::now());
        model.updated_at = chrono::Utc::now();
        Ok(Document {
            model,
            _state: PhantomData,
        })
    }

    pub fn reject(
        self,
        reason: String,
    ) -> Result<Document<RejectedDoc>, super::error::TransitionError> {
        let mut model = self.model;
        model.verification_status = DocumentVerificationStatus::Rejected;
        model.rejection_reason = Some(reason);
        model.updated_at = chrono::Utc::now();
        Ok(Document {
            model,
            _state: PhantomData,
        })
    }

    pub fn flag(self, reason: String) -> Result<Document<Flagged>, super::error::TransitionError> {
        let mut model = self.model;
        model.verification_status = DocumentVerificationStatus::Flagged;
        model.rejection_reason = Some(reason);
        model.fraud_flag = true;
        model.updated_at = chrono::Utc::now();
        Ok(Document {
            model,
            _state: PhantomData,
        })
    }
}
