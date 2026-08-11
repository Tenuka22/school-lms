use db::domain::counter::*;

fn make_counter_model() -> db::entity::common::counter::Model {
    db::entity::common::counter::Model {
        id: 1,
        name: "test_counter".to_string(),
        value: 0,
    }
}

#[test]
fn test_counter_from_model() {
    let model = make_counter_model();
    let counter = Counter::<Normal>::from_model(model.clone());
    assert_eq!(counter.inner().id, model.id);
}

#[test]
fn test_counter_current_value() {
    let model = make_counter_model();
    let counter = Counter::<Normal>::from_model(model);
    assert_eq!(counter.current_value(), 0);
}

#[test]
fn test_counter_next_value() {
    let model = make_counter_model();
    let mut counter = Counter::<Normal>::from_model(model);
    assert_eq!(counter.next_value(), 1);
    assert_eq!(counter.next_value(), 2);
    assert_eq!(counter.current_value(), 2);
}

#[test]
fn test_counter_from_trait() {
    let model = make_counter_model();
    let counter: Counter<Normal> = model.into();
    assert_eq!(counter.inner().name, "test_counter");
}
