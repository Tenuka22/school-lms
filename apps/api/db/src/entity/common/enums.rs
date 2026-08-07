use apistos::ApiComponent;
use schemars::JsonSchema;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum Gender {
    #[sea_orm(string_value = "Male")]
    Male,
    #[sea_orm(string_value = "Female")]
    Female,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum Religion {
    #[sea_orm(string_value = "Buddhism")]
    Buddhism,
    #[sea_orm(string_value = "Hinduism")]
    Hinduism,
    #[sea_orm(string_value = "Islam")]
    Islam,
    #[sea_orm(string_value = "Christianity")]
    Christianity,
    #[sea_orm(string_value = "Catholicism")]
    Catholicism,
    #[sea_orm(string_value = "Other")]
    Other,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum Nationality {
    #[sea_orm(string_value = "SriLankan")]
    SriLankan,
    #[sea_orm(string_value = "DualCitizen")]
    DualCitizen,
    #[sea_orm(string_value = "Other")]
    Other,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum MediumOfInstruction {
    #[sea_orm(string_value = "Sinhala")]
    Sinhala,
    #[sea_orm(string_value = "Tamil")]
    Tamil,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum StudentStatus {
    #[sea_orm(string_value = "Active")]
    Active,
    #[sea_orm(string_value = "Graduated")]
    Graduated,
    #[sea_orm(string_value = "Removed")]
    Removed,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum EnrollmentStatus {
    #[sea_orm(string_value = "Draft")]
    Draft,
    #[sea_orm(string_value = "Pending")]
    Pending,
    #[sea_orm(string_value = "Completed")]
    Completed,
    #[sea_orm(string_value = "PendingApproval")]
    PendingApproval,
    #[sea_orm(string_value = "Approved")]
    Approved,
    #[sea_orm(string_value = "Admitted")]
    Admitted,
    #[sea_orm(string_value = "Rejected")]
    Rejected,
    #[sea_orm(string_value = "Withdrawn")]
    Withdrawn,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum BatchStatus {
    #[sea_orm(string_value = "Open")]
    Open,
    #[sea_orm(string_value = "Closed")]
    Closed,
    #[sea_orm(string_value = "ListsPublished")]
    ListsPublished,
    #[sea_orm(string_value = "AppealsPeriod")]
    AppealsPeriod,
    #[sea_orm(string_value = "Archived")]
    Archived,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum EnrollmentType {
    #[sea_orm(string_value = "G1")]
    G1,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum G1Category {
    #[sea_orm(string_value = "CloseResident")]
    CloseResident,
    #[sea_orm(string_value = "PastPupilChild")]
    PastPupilChild,
    #[sea_orm(string_value = "Sibling")]
    Sibling,
    #[sea_orm(string_value = "MOEOrUGCStaffChild")]
    MOEOrUGCStaffChild,
    #[sea_orm(string_value = "GovernmentTransferOfficerChild")]
    GovernmentTransferOfficerChild,
    #[sea_orm(string_value = "OverseasArrival")]
    OverseasArrival,
    #[sea_orm(string_value = "ArmedForcesReserved")]
    ArmedForcesReserved,
    #[sea_orm(string_value = "SpecialNeeds")]
    SpecialNeeds,
    #[sea_orm(string_value = "LowIncome")]
    LowIncome,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum DocumentType {
    #[sea_orm(string_value = "BirthCertificate")]
    BirthCertificate,
    #[sea_orm(string_value = "TransferLetter")]
    TransferLetter,
    #[sea_orm(string_value = "ResidenceProof")]
    ResidenceProof,
    #[sea_orm(string_value = "GuardianNIC")]
    GuardianNIC,
    #[sea_orm(string_value = "Other")]
    Other,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum VerificationStatus {
    #[sea_orm(string_value = "Pending")]
    Pending,
    #[sea_orm(string_value = "Verified")]
    Verified,
    #[sea_orm(string_value = "Rejected")]
    Rejected,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum GuardianRelationship {
    #[sea_orm(string_value = "Father")]
    Father,
    #[sea_orm(string_value = "Mother")]
    Mother,
    #[sea_orm(string_value = "Guardian")]
    Guardian,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum AuditOperation {
    #[sea_orm(string_value = "Insert")]
    Insert,
    #[sea_orm(string_value = "Update")]
    Update,
    #[sea_orm(string_value = "Delete")]
    Delete,
    #[sea_orm(string_value = "Verify")]
    Verify,
    #[sea_orm(string_value = "Mark")]
    Mark,
    #[sea_orm(string_value = "AppealDecide")]
    AppealDecide,
    #[sea_orm(string_value = "ListGenerate")]
    ListGenerate,
    #[sea_orm(string_value = "Promote")]
    Promote,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum ApplicationStatus {
    #[sea_orm(string_value = "Draft")]
    Draft,
    #[sea_orm(string_value = "Submitted")]
    Submitted,
    #[sea_orm(string_value = "DocsPending")]
    DocsPending,
    #[sea_orm(string_value = "UnderVerification")]
    UnderVerification,
    #[sea_orm(string_value = "Verified")]
    Verified,
    #[sea_orm(string_value = "Marked")]
    Marked,
    #[sea_orm(string_value = "Shortlisted")]
    Shortlisted,
    #[sea_orm(string_value = "Appealed")]
    Appealed,
    #[sea_orm(string_value = "Finalized")]
    Finalized,
    #[sea_orm(string_value = "Admitted")]
    Admitted,
    #[sea_orm(string_value = "Rejected")]
    Rejected,
    #[sea_orm(string_value = "Withdrawn")]
    Withdrawn,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum ApplicationListCategory {
    #[sea_orm(string_value = "Main")]
    Main,
    #[sea_orm(string_value = "Waiting")]
    Waiting,
    #[sea_orm(string_value = "NotSelected")]
    NotSelected,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum DocumentVerificationStatus {
    #[sea_orm(string_value = "Pending")]
    Pending,
    #[sea_orm(string_value = "Verified")]
    Verified,
    #[sea_orm(string_value = "Rejected")]
    Rejected,
    #[sea_orm(string_value = "Flagged")]
    Flagged,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum G1DocumentType {
    #[sea_orm(string_value = "BirthCertificate")]
    BirthCertificate,
    #[sea_orm(string_value = "GuardianNIC")]
    GuardianNIC,
    #[sea_orm(string_value = "ResidenceProof")]
    ResidenceProof,
    #[sea_orm(string_value = "ElectoralProof")]
    ElectoralProof,
    #[sea_orm(string_value = "SiblingSchoolCertificate")]
    SiblingSchoolCertificate,
    #[sea_orm(string_value = "StaffAppointmentLetter")]
    StaffAppointmentLetter,
    #[sea_orm(string_value = "StaffServiceCertificate")]
    StaffServiceCertificate,
    #[sea_orm(string_value = "PastPupilCertificate")]
    PastPupilCertificate,
    #[sea_orm(string_value = "PastPupilExamCert")]
    PastPupilExamCert,
    #[sea_orm(string_value = "GovtServiceCertificate")]
    GovtServiceCertificate,
    #[sea_orm(string_value = "DisabilityCertificate")]
    DisabilityCertificate,
    #[sea_orm(string_value = "IncomeCertificate")]
    IncomeCertificate,
    #[sea_orm(string_value = "BaptismCertificate")]
    BaptismCertificate,
    #[sea_orm(string_value = "Other")]
    Other,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum SchoolType {
    #[sea_orm(string_value = "1AB")]
    OneAB,
    #[sea_orm(string_value = "1C")]
    OneC,
    #[sea_orm(string_value = "Type2")]
    Type2,
    #[sea_orm(string_value = "Type3")]
    Type3,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum SchoolCategory {
    #[sea_orm(string_value = "Urban")]
    Urban,
    #[sea_orm(string_value = "Rural")]
    Rural,
    #[sea_orm(string_value = "Difficult")]
    Difficult,
    #[sea_orm(string_value = "Estate")]
    Estate,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum SchoolStatus {
    #[sea_orm(string_value = "Active")]
    Active,
    #[sea_orm(string_value = "Inactive")]
    Inactive,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum ResidenceType {
    #[sea_orm(string_value = "Owned")]
    Owned,
    #[sea_orm(string_value = "Rented")]
    Rented,
    #[sea_orm(string_value = "Relative")]
    Relative,
    #[sea_orm(string_value = "Other")]
    Other,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum DistanceBand {
    #[sea_orm(string_value = "Under05")]
    Under05,
    #[sea_orm(string_value = "From05to1")]
    From05to1,
    #[sea_orm(string_value = "From1to2")]
    From1to2,
    #[sea_orm(string_value = "From2to3")]
    From2to3,
    #[sea_orm(string_value = "From3to5")]
    From3to5,
    #[sea_orm(string_value = "Over5")]
    Over5,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum StaffEmploymentType {
    #[sea_orm(string_value = "Permanent")]
    Permanent,
    #[sea_orm(string_value = "Temporary")]
    Temporary,
    #[sea_orm(string_value = "Contract")]
    Contract,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum StaffType {
    #[sea_orm(string_value = "Teacher")]
    Teacher,
    #[sea_orm(string_value = "Admin")]
    Admin,
    #[sea_orm(string_value = "Worker")]
    Worker,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum AppealType {
    #[sea_orm(string_value = "DistanceCalculation")]
    DistanceCalculation,
    #[sea_orm(string_value = "DocumentRejection")]
    DocumentRejection,
    #[sea_orm(string_value = "CategoryEligibility")]
    CategoryEligibility,
    #[sea_orm(string_value = "MarkingError")]
    MarkingError,
    #[sea_orm(string_value = "FraudAllegation")]
    FraudAllegation,
    #[sea_orm(string_value = "Other")]
    Other,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum AppealStatus {
    #[sea_orm(string_value = "Filed")]
    Filed,
    #[sea_orm(string_value = "UnderReview")]
    UnderReview,
    #[sea_orm(string_value = "ReEvaluated")]
    ReEvaluated,
    #[sea_orm(string_value = "Accepted")]
    Accepted,
    #[sea_orm(string_value = "Rejected")]
    Rejected,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum AdmissionListType {
    #[sea_orm(string_value = "MainList")]
    MainList,
    #[sea_orm(string_value = "WaitingList")]
    WaitingList,
    #[sea_orm(string_value = "RejectedList")]
    RejectedList,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum QuotaCategory {
    #[sea_orm(string_value = "General")]
    General,
    #[sea_orm(string_value = "Staff")]
    Staff,
    #[sea_orm(string_value = "Distance")]
    Distance,
    #[sea_orm(string_value = "SpecialNeeds")]
    SpecialNeeds,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum AuditAction {
    #[sea_orm(string_value = "INSERT")]
    Insert,
    #[sea_orm(string_value = "UPDATE")]
    Update,
    #[sea_orm(string_value = "DELETE")]
    Delete,
    #[sea_orm(string_value = "VERIFY")]
    Verify,
    #[sea_orm(string_value = "MARK")]
    Mark,
    #[sea_orm(string_value = "APPEAL_DECIDE")]
    AppealDecide,
    #[sea_orm(string_value = "LIST_GENERATE")]
    ListGenerate,
    #[sea_orm(string_value = "PROMOTE")]
    Promote,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum IncomeLevel {
    #[serde(rename = "below_25000")]
    #[sea_orm(string_value = "below_25000")]
    Below25000,
    #[serde(rename = "25000_50000")]
    #[sea_orm(string_value = "25000_50000")]
    Between25000And50000,
    #[serde(rename = "50000_100000")]
    #[sea_orm(string_value = "50000_100000")]
    Between50000And100000,
    #[serde(rename = "100000_200000")]
    #[sea_orm(string_value = "100000_200000")]
    Between100000And200000,
    #[serde(rename = "200000_500000")]
    #[sea_orm(string_value = "200000_500000")]
    Between200000And500000,
    #[serde(rename = "above_500000")]
    #[sea_orm(string_value = "above_500000")]
    Above500000,
}

#[derive(
    Debug,
    Clone,
    Copy,
    PartialEq,
    Eq,
    EnumIter,
    DeriveActiveEnum,
    Serialize,
    Deserialize,
    JsonSchema,
    ApiComponent,
)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum ElectoralDistrict {
    #[sea_orm(string_value = "Colombo")]
    Colombo,
    #[sea_orm(string_value = "Gampaha")]
    Gampaha,
    #[sea_orm(string_value = "Kalutara")]
    Kalutara,
    #[sea_orm(string_value = "Kandy")]
    Kandy,
    #[sea_orm(string_value = "Matale")]
    Matale,
    #[sea_orm(string_value = "Nuwara_Eliya")]
    NuwaraEliya,
    #[sea_orm(string_value = "Galle")]
    Galle,
    #[sea_orm(string_value = "Matara")]
    Matara,
    #[sea_orm(string_value = "Hambantota")]
    Hambantota,
    #[sea_orm(string_value = "Jaffna")]
    Jaffna,
    #[sea_orm(string_value = "Vanni")]
    Vanni,
    #[sea_orm(string_value = "Batticaloa")]
    Batticaloa,
    #[sea_orm(string_value = "Ampara")]
    Ampara,
    #[sea_orm(string_value = "Trincomalee")]
    Trincomalee,
    #[sea_orm(string_value = "Kurunegala")]
    Kurunegala,
    #[sea_orm(string_value = "Puttalam")]
    Puttalam,
    #[sea_orm(string_value = "Anuradhapura")]
    Anuradhapura,
    #[sea_orm(string_value = "Polonnaruwa")]
    Polonnaruwa,
    #[sea_orm(string_value = "Badulla")]
    Badulla,
    #[sea_orm(string_value = "Monaragala")]
    Monaragala,
    #[sea_orm(string_value = "Ratnapura")]
    Ratnapura,
    #[sea_orm(string_value = "Kegalle")]
    Kegalle,
}
