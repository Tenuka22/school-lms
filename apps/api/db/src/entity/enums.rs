use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum Gender {
    #[sea_orm(string_value = "Male")]
    Male,
    #[sea_orm(string_value = "Female")]
    Female,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum Nationality {
    #[sea_orm(string_value = "SriLankan")]
    SriLankan,
    #[sea_orm(string_value = "DualCitizen")]
    DualCitizen,
    #[sea_orm(string_value = "Other")]
    Other,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum MediumOfInstruction {
    #[sea_orm(string_value = "Sinhala")]
    Sinhala,
    #[sea_orm(string_value = "Tamil")]
    Tamil,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum StudentStatus {
    #[sea_orm(string_value = "Active")]
    Active,
    #[sea_orm(string_value = "Graduated")]
    Graduated,
    #[sea_orm(string_value = "Removed")]
    Removed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum EnrollmentStatus {
    #[sea_orm(string_value = "Draft")]
    Draft,
    #[sea_orm(string_value = "Pending")]
    Pending,
    #[sea_orm(string_value = "ProvisionallyApproved")]
    ProvisionallyApproved,
    #[sea_orm(string_value = "Approved")]
    Approved,
    #[sea_orm(string_value = "Rejected")]
    Rejected,
    #[sea_orm(string_value = "Withdrawn")]
    Withdrawn,
    #[sea_orm(string_value = "Removed")]
    Removed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum BatchStatus {
    #[sea_orm(string_value = "Open")]
    Open,
    #[sea_orm(string_value = "Closed")]
    Closed,
    #[sea_orm(string_value = "Archived")]
    Archived,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum EnrollmentType {
    #[sea_orm(string_value = "G1")]
    G1,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
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
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum VerificationStatus {
    #[sea_orm(string_value = "Pending")]
    Pending,
    #[sea_orm(string_value = "Verified")]
    Verified,
    #[sea_orm(string_value = "Rejected")]
    Rejected,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum GuardianRelationship {
    #[sea_orm(string_value = "Father")]
    Father,
    #[sea_orm(string_value = "Mother")]
    Mother,
    #[sea_orm(string_value = "Guardian")]
    Guardian,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema)]
#[sea_orm(rs_type = "String", db_type = "String(StringLen::None)")]
pub enum AuditOperation {
    #[sea_orm(string_value = "Insert")]
    Insert,
    #[sea_orm(string_value = "Update")]
    Update,
    #[sea_orm(string_value = "Delete")]
    Delete,
}

