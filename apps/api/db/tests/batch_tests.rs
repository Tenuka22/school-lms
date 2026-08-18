use db::domain::batch::*;
use db::entity::common::enums::BatchStatus;

#[test]
fn test_batch_new() {
    let batch = Batch::<Open>::new(
        2026,
        "G1-2026".to_string(),
        "Grade 1 Admission 2026".to_string(),
    );
    assert_eq!(batch.model.status, BatchStatus::Open);
    assert_eq!(batch.model.year, 2026);
    assert_eq!(batch.model.batch_code, "G1-2026");
}

#[test]
fn test_batch_close() {
    let batch = Batch::<Open>::new(2026, "G1-2026".to_string(), "Grade 1 2026".to_string());
    let closed = batch.close().unwrap();
    assert_eq!(closed.model.status, BatchStatus::Closed);
}

#[test]
fn test_batch_publish_lists() {
    let batch = Batch::<Open>::new(2026, "G1-2026".to_string(), "Grade 1 2026".to_string());
    let closed = batch.close().unwrap();
    let published = closed.publish_lists().unwrap();
    assert_eq!(published.model.status, BatchStatus::ListsPublished);
}

#[test]
fn test_batch_open_appeals() {
    let batch = Batch::<Open>::new(2026, "G1-2026".to_string(), "Grade 1 2026".to_string());
    let closed = batch.close().unwrap();
    let published = closed.publish_lists().unwrap();
    let deadline = chrono::Utc::now() + chrono::Duration::days(14);
    let appeals = published.open_appeals(deadline).unwrap();
    assert_eq!(appeals.model.status, BatchStatus::AppealsPeriod);
}

#[test]
fn test_batch_archive() {
    let batch = Batch::<Open>::new(2026, "G1-2026".to_string(), "Grade 1 2026".to_string());
    let closed = batch.close().unwrap();
    let published = closed.publish_lists().unwrap();
    let deadline = chrono::Utc::now() + chrono::Duration::days(14);
    let appeals = published.open_appeals(deadline).unwrap();
    let archived = appeals.archive().unwrap();
    assert_eq!(archived.model.status, BatchStatus::Archived);
}

#[test]
fn test_inner_and_into_inner() {
    let batch = Batch::<Open>::new(2026, "G1-2026".to_string(), "Grade 1 2026".to_string());
    let id = batch.inner().id;
    let inner = batch.into_inner();
    assert_eq!(inner.id, id);
}
