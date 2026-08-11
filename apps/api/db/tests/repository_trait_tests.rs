use db::repository::addresses::AddressRepo;
use db::repository::blacklist::BlacklistRepo;
use db::repository::counter::CounterRepo;
use db::repository::districts::DistrictRepo;
use db::repository::past_pupil_details::PastPupilDetailRepo;
use db::repository::schools::SchoolRepo;
use db::repository::secure_counter::SecureCounterRepo;
use db::repository::staff_details::StaffDetailRepo;
use db::repository::workspace_addresses::WorkspaceAddressRepo;

fn _assert_send_sync<T: Send + Sync + ?Sized>() {}

#[test]
fn test_address_repo_trait_bounds() {
    _assert_send_sync::<dyn AddressRepo>();
}

#[test]
fn test_blacklist_repo_trait_bounds() {
    _assert_send_sync::<dyn BlacklistRepo>();
}

#[test]
fn test_counter_repo_trait_bounds() {
    _assert_send_sync::<dyn CounterRepo>();
}

#[test]
fn test_secure_counter_repo_trait_bounds() {
    _assert_send_sync::<dyn SecureCounterRepo>();
}

#[test]
fn test_school_repo_trait_bounds() {
    _assert_send_sync::<dyn SchoolRepo>();
}

#[test]
fn test_staff_detail_repo_trait_bounds() {
    _assert_send_sync::<dyn StaffDetailRepo>();
}

#[test]
fn test_workspace_address_repo_trait_bounds() {
    _assert_send_sync::<dyn WorkspaceAddressRepo>();
}

#[test]
fn test_past_pupil_detail_repo_trait_bounds() {
    _assert_send_sync::<dyn PastPupilDetailRepo>();
}

#[test]
fn test_district_repo_trait_bounds() {
    _assert_send_sync::<dyn DistrictRepo>();
}
