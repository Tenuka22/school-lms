# G1 Admission — Pipeline Architecture

## Architectural Principle

The system uses an **imperative, flow-based pipeline** for G1 admissions. Users cannot freely change enrollment status or delete records. The system enforces a **locked-step state machine** that guarantees data integrity.

---

## The Pipeline (State Machine)

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────┐
│ PENDING  │ →  │COMPLETED │ →  │ PENDING      │ →  │ APPROVED │ →  │ ADMITTED │
│          │    │ (data    │    │ APPROVAL     │    │ (student │    │          │
│ (wizard) │    │  entry)  │    │ (marks calc) │    │  record) │    │          │
└──────────┘    └──────────┘    └──────────────┘    └──────────┘    └──────────┘
     │               │               │                    │
     └───────┬───────┴───────┬───────┴────────┬───────────┘
             ▼               ▼                ▼
        ┌──────────┐   ┌──────────┐    ┌──────────┐
        │ REJECTED │   │WITHDRAWN │    │ REMOVED  │
        └──────────┘   └──────────┘    └──────────┘
```

### Statuses

| Status | Description |
|--------|-------------|
| **PENDING** | Created, wizard begun but not complete |
| **COMPLETED** | All info entered, ready for marks calculation |
| **PENDING_APPROVAL** | Marks calculated, awaiting officer approval |
| **APPROVED** | Student record created, enrollment finalized |
| **ADMITTED** | Student formally admitted to school |
| **REJECTED** | Terminal: application rejected |
| **WITHDRAWN** | Terminal: parent/system withdrew |
| **REMOVED** | Terminal: system cleanup/deletion |

---

## Pipeline Dashboard

**File:** `apps/web/src/components/enrollment/g1/pipeline/pipeline-dashboard.tsx`

The dashboard shows a horizontal batch selector (scrollable cards with weight distribution bars) and a data table of enrollments filtered by the selected batch. Status lane summary cards show counts per status.

### Creating an Enrollment

1. Select a batch (required before creating).
2. Click "New Enrollment" → dialog with: full name, name with initials, date of birth, gender, nationality, medium of instruction, religion.
3. On submit: enrollment created with `enrollment_status: Pending`, navigates to wizard at `/$enrollment_id`.

### Data Table Actions

Each row has a dropdown with: View Details → wizard, Configure → wizard, Delete (with confirmation).

### Scoring Access

From the pipeline, navigate to `/scoring/$enrollment_id` to view and calculate marks.

---

## Enrollment Wizard

**File:** `apps/web/src/components/enrollment/g1/wizard/wizard-shell.tsx`

### 6-Step Wizard Flow

| Step | Component | Purpose |
|------|-----------|---------|
| 1 — Child | `WizardStepChild` | Full name, initials, DOB, gender, nationality, religion, birth cert, medium, category, overseas arrival |
| 2 — Guardian | `WizardStepGuardian` | Select guardians from existing guardian master records |
| 3 — Address | `WizardStepAddress` | Select addresses from existing address records, with type (Permanent) and residence type |
| 4 — Siblings | `WizardStepSiblings` | Select sibling students from existing student records |
| 5 — Documents | `WizardStepDocuments` | Upload documents via drop zone (MinIO storage) |
| 6 — Review & Lock | `WizardStepReview` | Final review; locks the enrollment |

> Note: The design docs describe a 7-step wizard with a School Selection step. The current implementation has 6 steps and does **not** include a school selection step. `SEEDED_SCHOOL_ID = "00000000-0000-0000-0000-000000000001"` is hardcoded.

### Wizard Mechanics

- **Step locking**: Users can only navigate to `savedSteps + 1`. Completed steps show a green checkmark; locked steps show a cross icon.
- **Auto-save**: Each step auto-saves via dedicated mutations.
- **Persistence**: The `wizard_step` field tracks progress. `wizard_step: 6` = completed.
- **Completion**: Sets `wizard_step: 6`, `enrollment_status: Completed`, shows locked confirmation screen.

---