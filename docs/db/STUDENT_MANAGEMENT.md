# St. Aloysius College - Student Management System

## Overview
The Student Management System handles the lifecycle of Grade 1 student records.

## Key Design Principles

1. **Master Identity Pattern**: `students`, `guardians`, and `addresses` are master identity tables with unique constraints (NIC, birth certificate) — data is defined once and reused.
2. **Join-Table Pattern**: Relationships are expressed through join tables:
   - `student_join_addresses` / `g1_enrollment_join_addresses` → link students or enrollments to `addresses`
   - `student_join_guardians` / `g1_enrollment_join_guardians` → link students or enrollments to `guardians`
   - This avoids duplication and allows a single guardian/address to serve multiple children.
3. **Application Snapshots**: `g1_enrollments` captures the snapshot of an application at submission time, linked to shared master records through join tables rather than duplicating them inline.
4. **Enrollment Batches**: `enrollment_batches` groups applications by admission cycle (e.g., `G1-2026`, intake year).
5. **Strict Typing**: Categories (`G1Category`), statuses (`EnrollmentStatus`), and document types use database-level enums.
6. **Audit Trail**: Every mutable entity has a `_audit` table capturing old/new values as JSON on every Insert/Update/Delete — enabling full forensic traceability.

## Entity Map

| Table | Role |
|-------|------|
| `students` | Master student identity |
| `guardians` | Master guardian identity (unique by NIC) |
| `addresses` | Master address records |
| `g1_enrollments` | Enrollment applications (snapshot + FK to master tables via joins) |
| `enrollment_batches` | Admission cycle definition |
| `g1_enrollment_documents` | Uploaded documents per enrollment |
| `student_join_addresses` | M:N student ↔ addresses |
| `student_join_guardians` | M:N student ↔ guardians |
| `g1_enrollment_join_addresses` | M:N enrollment ↔ addresses |
| `g1_enrollment_join_guardians` | M:N enrollment ↔ guardians |
| `*_audit` | Append-only change history for addresses, guardians, students, enrollments, documents |

## Enrollment Lifecycle & Flow

### 1. Application Submission
- **G1 (Entry Point)**: Begins directly at the Draft phase to create a new `students` record.
- Must be submitted via **Registered Post** (`submission_method`).
- A valid **birth certificate** is mandatory; if unavailable, a **Registrar General age certificate** is accepted (`alternative_age_certificate`, `alternative_age_certificate_ref`).
- Guardian and address data are stored in the master `guardians`/`addresses` tables and linked via `g1_enrollment_join_*` — the same guardian/address can be reused for siblings.

### 2. Guardian Association
- **Master Guardians**: Defined in `guardians`, uniquely identified by NIC.
- **Association**: `g1_enrollment_join_guardians` links the enrollment to masters; `student_join_guardians` maintains the permanent student-guardian relationship post-admission.

### 3. Interview & Scoring
- Each applicant attends an interview (`interview_date`, `interview_completed`).
- Scored on category, distance, and interview → `interview_score`, `category_score`, `distance_score`, `total_score` → `rank`.

### 4. Final Selection
- **Final selection list** published Dec 20.

## File Storage
Uploaded documents (birth certificates, residence proofs, etc.) are stored in **MinIO** (S3-compatible object storage), not in the database. The REST API exposes `POST /api/uploads` (multipart `file` field, requires `file:upload` permission) which streams the file to MinIO and returns a public URL + key. The returned `file_url` is persisted in `g1_enrollment_documents`.

## Breaking Logic & Contextual Nuances (Sri Lankan Schooling)
*   **Age Eligibility**: Validated in the application layer.
*   **Distance Verification**: Validated in the application layer.
*   **Medium Restriction**: Only Sinhala/Tamil permitted at G1 entry (English medium not allowed per circular 25/2026).
*   **Alternative Age Certificate**: Accepted when birth certificate unavailable (`alternative_age_certificate`).
*   **Atomic Workflows**: Managed in the application layer.
