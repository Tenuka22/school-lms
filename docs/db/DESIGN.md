# Database Architecture Overview

## Overview
This document outlines the core database architectural principles and standards adopted for this application.

## Core Design Principles

1. **Tech Stack**: The system uses **PostgreSQL** as the primary relational database, interfaced via **SeaORM** for type-safe data access in Rust.
2. **Primary Keys**: All primary keys are `UUID`s. This ensures secure, universally unique identifiers that prevent enumeration attacks and support distributed systems.
3. **Strict Typing**:
   - Database-level `ENUM` types are used extensively for statuses, categories, and fixed domain sets to ensure data integrity.
   - Rust types map directly to these DB types using `DeriveActiveEnum`.
4. **Audit Pattern**:
   - All mutable entities have an associated `_status_history` or `_audit` table.
   - These are **append-only** to ensure an immutable trail of accountability for every state transition.
## Core Design Principles
...
5. **Decoupling Pattern (Identity vs. Snapshot)**:
   - Sensitive entities (e.g., users, core profiles, guardians) are separated into "Master Identity" tables to enforce uniqueness (e.g., NIC-based uniqueness for guardians).
   - Immutable "Snapshot" tables are used to capture the state of entities at specific points in time (e.g., enrollment applications), preserving historical data integrity even when master records evolve.
6. **Referential Integrity**: 
   - We avoid polymorphic relationships. Documents are stored in enrollment-specific tables to enforce strict Foreign Key constraints to the parent enrollment record.

## Implementation Details
- **Timestamps**: All timestamps use `DateTime<Utc>` (or `TIMESTAMPTZ` in Postgres) to ensure time-zone neutrality.
- **Foreign Keys**: Enforced at the database level for referential integrity.
- **Constraints**: Partial `UNIQUE` indexes are used to allow `NULL` values in fields that must be unique only when present (e.g., `admission_number`, `nic`).
