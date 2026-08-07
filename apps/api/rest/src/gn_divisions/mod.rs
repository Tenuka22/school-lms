pub mod handlers;

use std::sync::LazyLock;

use apistos::web;
use handlers::list::{list_gn_divisions, GnDivisionEntry};

static GN_DIVISIONS_RAW: &str = include_str!("gn_divisions.json");

static GN_DIVISIONS: LazyLock<Vec<GnDivisionEntry>> = LazyLock::new(|| {
    let raw: serde_json::Value = serde_json::from_str(GN_DIVISIONS_RAW)
        .expect("Failed to parse gn_divisions.json");
    let entities = raw["entities"]
        .as_array()
        .expect("gn_divisions.json missing 'entities' array");
    entities
        .iter()
        .map(|e| GnDivisionEntry {
            id: e["id"].as_str().unwrap_or("").to_string(),
            name_local: e["name_local"].as_str().unwrap_or("").to_string(),
            name_en: e["name_en"].as_str().unwrap_or("").to_string(),
            slug: e["slug"].as_str().unwrap_or("").to_string(),
            lat: e["lat"].as_f64().unwrap_or(0.0),
            lon: e["lon"].as_f64().unwrap_or(0.0),
            parent_id: e["parent_id"].as_str().unwrap_or("").to_string(),
            parent_name_en: e["parent_name_en"].as_str().unwrap_or("").to_string(),
            parent_name_local: e["parent_name_local"].as_str().unwrap_or("").to_string(),
            postal_code: e["postal_code"].as_str().unwrap_or("").to_string(),
        })
        .collect()
});

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/gn-divisions", web::get().to(list_gn_divisions));
}
