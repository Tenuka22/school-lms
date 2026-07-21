# Database Architecture Overview

## Overview
This document outlines the core database architectural principles and standards adopted for this application.

## Entity Organization

Entities are organized into domain folders under `apps/api/db/src/entity/`:

| Domain | Purpose | Entities |
|--------|---------|----------|
| `common` | Shared identity and lookup tables | addresses, workspace_addresses, guardians, schools, staff_details, past_pupil_details, siblings, audit_logs, enrollment_batches, counters |
| `user` | Authentication and RBAC | user, role, permission, role_permission, user_role, session |
| `student` | Student lifecycle | student, student_join_addresses, student_join_guardians, students_audit |
| `g1` | Grade 1 admissions | applications, documents, join_addresses, join_workspace_addresses, join_guardians, join_staff_details, join_past_pupil_details, join_siblings, marks_breakdown, appeal_history, admission_lists, audit |

All entities are re-exported at the top level via `db::entity::*` for backward compatibility.

## Core Design Principles

1. **Tech Stack**: The system uses **PostgreSQL** as the primary relational database, interfaced via **SeaORM** for type-safe data access in Rust.
2. **Primary Keys**: All primary keys are `UUID`s. This ensures secure, universally unique identifiers that prevent enumeration attacks and support distributed systems.
3. **Domain-Driven Structure**:
   - **Common Domain**: Master identity tables (`guardians`, `addresses`, `workspace_addresses`, `schools`) with strict uniqueness constraints.
   - **User Domain**: Authentication and authorization entities.
   - **Student Domain**: Student profiles and relationships.
   - **G1 Admission Domain**: Application-specific tables with join patterns to common masters.
4. **Decoupling Pattern (Identity vs. Snapshot)**:
   - Sensitive entities are separated into "Master Identity" tables in `common`.
   - Immutable "Snapshot" tables capture application state at specific points in time.
   - Category-specific data (`staff_details`, `past_pupil_details`, `siblings`) lives in `common` and is linked to G1 applications via dedicated join tables (`g1_join_staff_details`, `g1_join_past_pupil_details`, `g1_join_siblings`).
5. **Audit Pattern**:
   - All mutable entities have an associated `_audit` table.
   - These are **append-only** to ensure an immutable trail of accountability for every state transition.
6. **Referential Integrity**: 
   - We avoid polymorphic relationships. Documents are stored in enrollment-specific tables to enforce strict Foreign Key constraints to the parent enrollment record.

## Implementation Details
- **Timestamps**: All timestamps use `DateTime<Utc>` (or `TIMESTAMPTZ` in Postgres) to ensure time-zone neutrality.
- **Foreign Keys**: Enforced at the database level for referential integrity.
- **Constraints**: Partial `UNIQUE` indexes are used to allow `NULL` values in fields that must be unique only when present.
- **File Storage**: Documents are stored in **MinIO** (S3-compatible object storage). The `g1_documents` entity includes `file_url`, `file_key`, `file_hash`, `file_size`, and `content_type` for MinIO integration.
