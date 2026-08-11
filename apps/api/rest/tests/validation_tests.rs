use db::domain::error::AppError;
use rest::validation::*;

#[test]
fn test_email_valid() {
    let e = Email::new("user@example.com".into()).unwrap();
    assert_eq!(e.into_inner(), "user@example.com");
}

#[test]
fn test_email_empty() {
    assert!(matches!(Email::new("".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_email_no_at() {
    assert!(matches!(Email::new("userexample.com".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_email_no_dot() {
    assert!(matches!(Email::new("user@examplecom".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_email_double_at() {
    assert!(matches!(Email::new("user@@example.com".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_phone_valid_07() {
    let p = Phone::new("0771234567".into()).unwrap();
    assert_eq!(p.into_inner(), "+94771234567");
}

#[test]
fn test_phone_valid_plus94() {
    let p = Phone::new("+94771234567".into()).unwrap();
    assert_eq!(p.into_inner(), "+94771234567");
}

#[test]
fn test_phone_valid_94() {
    let p = Phone::new("94771234567".into()).unwrap();
    assert_eq!(p.into_inner(), "+94771234567");
}

#[test]
fn test_phone_valid_short() {
    let p = Phone::new("771234567".into()).unwrap();
    assert_eq!(p.into_inner(), "+94771234567");
}

#[test]
fn test_phone_empty() {
    assert!(matches!(Phone::new("".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_phone_invalid_length() {
    assert!(matches!(Phone::new("077123".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_full_name_valid() {
    let n = FullName::new("John Doe".into()).unwrap();
    assert_eq!(n.into_inner(), "John Doe");
}

#[test]
fn test_full_name_single_word() {
    assert!(matches!(FullName::new("John".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_full_name_empty() {
    assert!(matches!(FullName::new("".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_name_with_initials_valid() {
    let n = NameWithInitials::new("A.B. Perera".into()).unwrap();
    assert_eq!(n.into_inner(), "A.B. Perera");
}

#[test]
fn test_name_with_initials_no_uppercase() {
    assert!(matches!(NameWithInitials::new("john doe".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_nic_old_format() {
    let n = NicNumber::new("123456789V".into()).unwrap();
    assert_eq!(n.into_inner(), "123456789V");
}

#[test]
fn test_nic_new_format() {
    let n = NicNumber::new("123456789012".into()).unwrap();
    assert_eq!(n.into_inner(), "123456789012");
}

#[test]
fn test_nic_invalid() {
    assert!(matches!(NicNumber::new("123".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_non_empty_valid() {
    let n = NonEmpty::new("hello".into(), "field").unwrap();
    assert_eq!(n.into_inner(), "hello");
}

#[test]
fn test_non_empty_blank() {
    assert!(matches!(NonEmpty::new("   ".into(), "field"), Err(AppError::BadRequest(_))));
}

#[test]
fn test_postal_code_valid() {
    let p = PostalCode::new("10100".into()).unwrap();
    assert_eq!(p.into_inner(), "10100");
}

#[test]
fn test_postal_code_too_short() {
    assert!(matches!(PostalCode::new("12".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_search_query_valid() {
    let s = SearchQuery::new("test".into()).unwrap();
    assert_eq!(s.into_inner(), "test");
}

#[test]
fn test_search_query_too_long() {
    let long = "a".repeat(201);
    assert!(matches!(SearchQuery::new(long), Err(AppError::BadRequest(_))));
}

#[test]
fn test_url_valid() {
    let u = Url::new("https://example.com".into()).unwrap();
    assert_eq!(u.into_inner(), "https://example.com");
}

#[test]
fn test_url_no_protocol() {
    assert!(matches!(Url::new("example.com".into()), Err(AppError::BadRequest(_))));
}

#[test]
fn test_address_line_valid() {
    let a = AddressLine::new("123 Main St".into(), "line1").unwrap();
    assert_eq!(a.into_inner(), "123 Main St");
}

#[test]
fn test_address_line_too_long() {
    let long = "a".repeat(256);
    assert!(matches!(AddressLine::new(long, "field"), Err(AppError::BadRequest(_))));
}

#[test]
fn test_latitude_valid() {
    let lat = Latitude::new(45.0).unwrap();
    assert_eq!(lat.0, 45.0);
}

#[test]
fn test_latitude_out_of_range() {
    assert!(matches!(Latitude::new(91.0), Err(AppError::BadRequest(_))));
    assert!(matches!(Latitude::new(-91.0), Err(AppError::BadRequest(_))));
}

#[test]
fn test_longitude_valid() {
    let lon = Longitude::new(180.0).unwrap();
    assert_eq!(lon.0, 180.0);
}

#[test]
fn test_longitude_out_of_range() {
    assert!(matches!(Longitude::new(181.0), Err(AppError::BadRequest(_))));
    assert!(matches!(Longitude::new(-181.0), Err(AppError::BadRequest(_))));
}

#[test]
fn test_distance_km_valid() {
    let d = DistanceKm::new(10.5).unwrap();
    assert_eq!(d.0, 10.5);
}

#[test]
fn test_distance_km_negative() {
    assert!(matches!(DistanceKm::new(-1.0), Err(AppError::BadRequest(_))));
}

#[test]
fn test_year_valid() {
    let y = Year::new(2024).unwrap();
    assert_eq!(y.0, 2024);
}

#[test]
fn test_year_out_of_range() {
    assert!(matches!(Year::new(1899), Err(AppError::BadRequest(_))));
    assert!(matches!(Year::new(2101), Err(AppError::BadRequest(_))));
}

#[test]
fn test_percentage_valid() {
    let p = Percentage::new(50).unwrap();
    assert_eq!(p.0, 50);
}

#[test]
fn test_percentage_out_of_range() {
    assert!(matches!(Percentage::new(-1), Err(AppError::BadRequest(_))));
    assert!(matches!(Percentage::new(101), Err(AppError::BadRequest(_))));
}

#[test]
fn test_percentage_sum_valid() {
    assert!(Percentage::sum(&[30, 30, 40]).is_ok());
}

#[test]
fn test_percentage_sum_invalid() {
    assert!(Percentage::sum(&[30, 30, 30]).is_err());
}

#[test]
fn test_wizard_step_valid() {
    let w = WizardStep::new(3).unwrap();
    assert_eq!(w.0, 3);
}

#[test]
fn test_wizard_step_out_of_range() {
    assert!(matches!(WizardStep::new(0), Err(AppError::BadRequest(_))));
    assert!(matches!(WizardStep::new(8), Err(AppError::BadRequest(_))));
}

#[test]
fn test_current_grade_valid() {
    let g = CurrentGrade::new(5).unwrap();
    assert_eq!(g.0, 5);
}

#[test]
fn test_current_grade_out_of_range() {
    assert!(matches!(CurrentGrade::new(0), Err(AppError::BadRequest(_))));
    assert!(matches!(CurrentGrade::new(14), Err(AppError::BadRequest(_))));
}

#[test]
fn test_file_size_valid() {
    let f = FileSize::new(1024, 25 * 1024 * 1024).unwrap();
    assert_eq!(f.0, 1024);
}

#[test]
fn test_file_size_zero() {
    assert!(matches!(FileSize::new(0, 25 * 1024 * 1024), Err(AppError::BadRequest(_))));
}

#[test]
fn test_file_size_exceeds_limit() {
    assert!(matches!(FileSize::new(26 * 1024 * 1024, 25 * 1024 * 1024), Err(AppError::BadRequest(_))));
}
