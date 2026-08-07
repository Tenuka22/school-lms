pub mod handlers;

use std::sync::LazyLock;

use apistos::web;
use handlers::list::{list_polling_divisions, PollingDivisionEntry};

static POLLING_DIVISIONS_RAW: &str = include_str!("polling_divisions.json");

static POLLING_DIVISIONS: LazyLock<Vec<PollingDivisionEntry>> = LazyLock::new(|| {
    let raw: serde_json::Value = serde_json::from_str(POLLING_DIVISIONS_RAW)
        .expect("Failed to parse polling_divisions.json");
    let entries = raw["polling_divisions"]
        .as_array()
        .expect("polling_divisions.json missing 'polling_divisions' array");
    entries
        .iter()
        .map(|e| PollingDivisionEntry {
            value: e["value"].as_str().unwrap_or("").to_string(),
            label: e["label"].as_str().unwrap_or("").to_string(),
            si: e["si"].as_str().unwrap_or("").to_string(),
            district: e["district"].as_str().unwrap_or("").to_string(),
        })
        .collect()
});

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/polling-divisions", web::get().to(list_polling_divisions));
}
