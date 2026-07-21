pub mod handlers;

use apistos::web;

use handlers::{
    create, create_sibling, delete, get, get_documents, get_guardians, get_siblings,
    get_workspace_addresses, list, save_documents, save_guardians, save_siblings, save_step,
    save_workspace_addresses, update,
};

pub fn routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/g1-applications", web::get().to(list::list_applications))
        .route("/g1-applications/{id}", web::get().to(get::get_application))
        .route(
            "/g1-applications",
            web::post().to(create::create_application),
        )
        .route(
            "/g1-applications/{id}",
            web::put().to(update::update_application),
        )
        .route(
            "/g1-applications/{id}",
            web::delete().to(delete::delete_application),
        )
        .route(
            "/g1-applications/{id}/submit",
            web::post().to(create::submit_application),
        )
        .route(
            "/g1-applications/{id}/calculate-marks",
            web::post().to(create::calculate_marks),
        )
        .route(
            "/g1-applications/generate-lists",
            web::post().to(create::generate_admission_lists),
        )
        .route(
            "/g1-applications/{id}/wizard-step",
            web::patch().to(save_step::save_wizard_step),
        )
        .route(
            "/g1-applications/{id}/guardians",
            web::get().to(get_guardians::get_application_guardians),
        )
        .route(
            "/g1-applications/{id}/guardians",
            web::put().to(save_guardians::save_guardians),
        )
        .route(
            "/g1-applications/{id}/workspace-addresses",
            web::get().to(get_workspace_addresses::get_application_workspace_addresses),
        )
        .route(
            "/g1-applications/{id}/workspace-addresses",
            web::put().to(save_workspace_addresses::save_workspace_addresses),
        )
        .route(
            "/g1-applications/{id}/siblings",
            web::get().to(get_siblings::get_application_siblings),
        )
        .route(
            "/g1-applications/{id}/siblings",
            web::put().to(save_siblings::save_siblings),
        )
        .route(
            "/g1-applications/{id}/create-sibling",
            web::post().to(create_sibling::create_sibling),
        )
        .route(
            "/g1-applications/{id}/documents",
            web::get().to(get_documents::get_application_documents),
        )
        .route(
            "/g1-applications/{id}/documents",
            web::put().to(save_documents::save_application_documents),
        );
}
