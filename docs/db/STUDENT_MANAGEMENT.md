# Student Management System

## Overview

The Student Management system handles Grade 1 admissions for the school. It provides a pipeline-based enrollment workflow from initial data entry through final scoring and admission decisions.

For the frontend implementation details (routes, components, wizard steps, scoring), see [docs/frontend/flow/enrollment-g1/](frontend/flow/enrollment-g1/01-ROUTES.md).

---

## Architecture

### Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/_authenticated/student-management/` | `StudentManagement` | Landing page with overview |
| `/_authenticated/student-management/enrollment/g1/` | `PipeDashboard` | Pipeline dashboard — batch selection, enrollment list, filtering |
| `/_authenticated/student-management/enrollment/g1/$enrollment_id` | `WizardShell` | 6-step enrollment wizard for a single application |
| `/_authenticated/student-management/enrollment/g1/scoring/$enrollment_id` | `ScoringDashboard` | Scoring breakdown and marks calculation |

---

## Pipeline Dashboard

**File:** `apps/web/src/components/enrollment/g1/pipeline/pipeline-dashboard.tsx`

### Batch Selection

- Batches are displayed as horizontal scrollable cards.
- Each card shows: year, status badge, seat allocation, and a weight distribution bar.
- A "New Batch" button opens a dialog to create a batch with:
  - Year
  - Total student allocation (seats)
  - Weight distribution across 6 priority categories

### Enrollment Status Lanes

The dashboard groups enrollments into 6 status lanes displayed as summary cards:

| Status | Description |
|--------|-------------|
| `Pending` | Data entry in progress |
| `Completed` | Data entered, ready for marks |
| `PendingApproval` | Awaiting officer approval |
| `Approved` | Approved |
| `Admitted` | Formally admitted |
| `Rejected` | Not selected |

### Data Table Columns

| Column | Filterable | Description |
|--------|-----------|-------------|
| Full Name | Yes | Clickable link to enrollment wizard |
| Initials | Yes | Name with initials |
| DOB | No | Date of birth |
| Gender | Yes | Male / Female |
| Nationality | Yes | SriLankan, DualCitizen, Other |
| Category | Yes | CloseResident, PastPupilChild, Sibling, MOEOrUGCStaffChild, GovernmentTransferOfficerChild, OverseasArrival, ArmedForcesReserved |
| Medium | Yes | Sinhala, Tamil |
| Status | Yes | All enrollment statuses |
| Marks | No | Calculated score (color-coded: green ≥75, amber ≥50, red <50) |
| Created | No | Creation timestamp |

### Features

- **Filtering**: Server-side filters synced via TanStack Router search params
- **Sorting**: Manual sorting on any column
- **Pagination**: Server-side with configurable page size
- **Actions per row**: View Details, Configure (edit), Delete (with confirmation dialog)

### Creating an Enrollment

1. Select a batch (required before creating).
2. Click "New Enrollment" to open the dialog.
3. Fill in: full name, name with initials, date of birth, gender, nationality, medium of instruction, religion.
4. On submit, a `G1Application` is created with `enrollment_status: Pending` and the user is navigated to the wizard.

---

## Enrollment Wizard

**File:** `apps/web/src/components/enrollment/g1/wizard/wizard-shell.tsx`

### 6-Step Wizard Flow

| Step | Component | Data Saved |
|------|-----------|------------|
| 1 — Child | `WizardStepChild` | full_name, name_with_initials, date_of_birth, gender, nationality, religion, birth_certificate_number, medium_of_instruction, category, overseas_arrival_date |
| 2 — Guardian | `WizardStepGuardian` | Selected guardian IDs (from existing guardian master) |
| 3 — Address | `WizardStepAddress` | Address entries with type (Permanent), residence_type (Owned/Rented), is_primary flag |
| 4 — Siblings | `WizardStepSiblings` | Selected sibling student IDs (from existing students) |
| 5 — Documents | `WizardStepDocuments` | Uploaded documents with type, file_url, file_key, content_type, file_size |
| 6 — Review & Lock | `WizardStepReview` | Final review; locks the enrollment |

### Wizard Mechanics

- **Step locking**: Users can only navigate to `savedSteps + 1`. Completed steps show a green checkmark; locked steps show a cross icon.
- **Auto-save**: Each step auto-saves via dedicated mutations (`saveWizardStepMutation`, `saveGuardiansMutation`, `saveAddressesMutation`, `saveSiblingsMutation`, `saveApplicationDocumentsMutation`).
- **Persistence**: The `wizard_step` field on the application record tracks progress. `wizard_step: 6` means completed.
- **Completion**: Step 6 calls `handleComplete` which sets `wizard_step: 6`, `enrollment_status: Completed`, and shows a locked confirmation screen.

### Key Constant

```ts
SEEDED_SCHOOL_ID = "00000000-0000-0000-0000-000000000001"
```

All enrollments are currently assigned to this seeded school. This is a placeholder until multi-school support is implemented.

---

## Scoring Dashboard

**File:** `apps/web/src/components/enrollment/g1/scoring/scoring-dashboard.tsx`

### Scoring Categories

| Code | Label | Weight | Description |
|------|-------|--------|-------------|
| PROX | Proximity (Residential Address) | 50% | Distance from residence to school |
| STAFF | School Staff Child | 25% | Parent employed as staff at this school |
| SIBLING | Sibling in School | 14% | Sibling currently enrolled at this school |
| ALUMNI | Past Pupil Child | 6% | Parent is a past pupil of this school |
| GOVT | Government Employee | 4% | Parent is a government employee |
| SPECIAL | Special Circumstances | 1% | Disability, low income, or special needs |

### Distance Bands (Proximity Scoring)

| Range | Raw Marks |
|-------|-----------|
| < 0.5 km | 100 |
| 0.5 – 1 km | 80 |
| 1 – 2 km | 60 |
| 2 – 3 km | 40 |
| 3 – 5 km | 20 |
| > 5 km | 10 |

### Features

- **Calculate Marks**: Calls `POST /api/g1/applications/{id}/calculate-marks` to compute the weighted total.
- **Total Marks Banner**: Shows total marks when calculated.
- **Per-category estimated contribution**: Shows estimated weighted score per category (weight × totalMarks / 100).
- **Distance Bands Reference**: Shows the 6 proximity scoring bands.

---

## Enrollment Lifecycle

```
PENDING → COMPLETED → PENDING_APPROVAL → APPROVED → ADMITTED
                                                    → REJECTED
                         → WITHDRAWN
                         → REMOVED
```

| Status | Description |
|--------|-------------|
| `Pending` | Enrollment created, wizard not completed |
| `Completed` | Wizard finished, awaiting scoring |
| `PendingApproval` | Scoring done, awaiting officer review |
| `Approved` | Officer approved the application |
| `Admitted` | Formally admitted to the school |
| `Rejected` | Not selected for admission |
| `Withdrawn` | Applicant withdrew |
| `Removed` | Removed by admin |

---

## Database Entities

Refer to `docs/db/DESIGN.md` for the full schema. Key entities:

- **`g1.applications`**: Core enrollment record with status, marks, wizard_step, school_id, batch_id.
- **`g1.documents`**: Uploaded files linked to an application (MinIO storage).
- **`g1.join_addresses`**: Address entries for an application (type, residence_type, is_primary).
- **`g1.join_guardians`**: Guardian links for an application.
- **`g1.join_siblings`**: Sibling links for an application.
- **`g1.join_staff_details`**: Staff category details.
- **`g1.join_past_pupil_details`**: Alumni category details.
- **`g1.marks_breakdown`**: Per-category raw and weighted scores.
- **`g1.appeal_history`**: Appeal records with re-evaluation.
- **`g1.admission_lists`**: Final admission list entries (Main/Waiting).
- **`enrollment_batches`** (common): Batch configuration with weight distribution and seat allocation.

---

## File Uploads

Documents are stored in **MinIO** (S3-compatible object storage). Uploaded files include:
- `file_url` — public or presigned URL
- `file_key` — MinIO object key
- `file_hash` — integrity hash
- `file_size` — file size in bytes
- `content_type` — MIME type
