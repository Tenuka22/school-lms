use db::domain::document::*;
use db::entity::common::enums::{DocumentVerificationStatus, G1DocumentType};

#[test]
fn test_document_new() {
    let app_id = uuid::Uuid::new_v4();
    let doc = Document::<Uploaded>::new(
        app_id,
        G1DocumentType::BirthCertificate,
        "https://example.com/doc.pdf".to_string(),
        "uploads/doc.pdf".to_string(),
    );
    assert_eq!(doc.model.application_id, app_id);
    assert_eq!(doc.model.document_type, G1DocumentType::BirthCertificate);
    assert_eq!(
        doc.model.verification_status,
        DocumentVerificationStatus::Pending
    );
    assert!(!doc.model.fraud_flag);
}

#[test]
fn test_document_start_review() {
    let app_id = uuid::Uuid::new_v4();
    let doc = Document::<Uploaded>::new(
        app_id,
        G1DocumentType::GuardianNIC,
        "https://example.com/nic.jpg".to_string(),
        "uploads/nic.jpg".to_string(),
    );
    let reviewing = doc.start_review().unwrap();
    assert_eq!(
        reviewing.model.verification_status,
        DocumentVerificationStatus::Pending
    );
}

#[test]
fn test_document_verify() {
    let app_id = uuid::Uuid::new_v4();
    let verifier_id = uuid::Uuid::new_v4();
    let doc = Document::<Uploaded>::new(
        app_id,
        G1DocumentType::BirthCertificate,
        "https://example.com/doc.pdf".to_string(),
        "uploads/doc.pdf".to_string(),
    );
    let reviewing = doc.start_review().unwrap();
    let verified = reviewing.verify(verifier_id).unwrap();
    assert_eq!(
        verified.model.verification_status,
        DocumentVerificationStatus::Verified
    );
    assert_eq!(verified.model.verified_by, Some(verifier_id));
    assert!(verified.model.verified_at.is_some());
}

#[test]
fn test_document_reject() {
    let app_id = uuid::Uuid::new_v4();
    let doc = Document::<Uploaded>::new(
        app_id,
        G1DocumentType::ResidenceProof,
        "https://example.com/proof.pdf".to_string(),
        "uploads/proof.pdf".to_string(),
    );
    let reviewing = doc.start_review().unwrap();
    let rejected = reviewing.reject("unclear scan".to_string()).unwrap();
    assert_eq!(
        rejected.model.verification_status,
        DocumentVerificationStatus::Rejected
    );
    assert_eq!(
        rejected.model.rejection_reason.as_deref(),
        Some("unclear scan")
    );
}

#[test]
fn test_document_flag() {
    let app_id = uuid::Uuid::new_v4();
    let doc = Document::<Uploaded>::new(
        app_id,
        G1DocumentType::Other,
        "https://example.com/other.pdf".to_string(),
        "uploads/other.pdf".to_string(),
    );
    let reviewing = doc.start_review().unwrap();
    let flagged = reviewing.flag("suspicious".to_string()).unwrap();
    assert_eq!(
        flagged.model.verification_status,
        DocumentVerificationStatus::Flagged
    );
    assert!(flagged.model.fraud_flag);
}

#[test]
fn test_inner_and_into_inner() {
    let app_id = uuid::Uuid::new_v4();
    let doc = Document::<Uploaded>::new(
        app_id,
        G1DocumentType::BirthCertificate,
        "https://example.com/doc.pdf".to_string(),
        "uploads/doc.pdf".to_string(),
    );
    let id = doc.inner().id;
    let inner = doc.into_inner();
    assert_eq!(inner.id, id);
}
