# Imperative Application Wizard

## Route
`/student-management/enrollment/g1/$enrollment-id`
> File: `apps/web/src/routes/_authenticated/student-management/enrollment/g1/$enrollment-id.tsx`

---

## Imperative Rules

1. **Wizard is the only path** to fill enrollment data. No standalone edit dialogs.
2. **Steps are sequential and locked.** Step N cannot be accessed until Steps 1..N-1 are validated.
3. **Once COMPLETED, wizard is read-only.** Re-open shows review mode; no edits.
4. **No manual status changes.** Status transitions happen only via pipeline actions.
5. **Enrollment only exists in PENDING or COMPLETED** during wizard access. Beyond COMPLETED, the enrollment moves to `/applications/$id`.

---

## Entity Data Flow (Pipeline Model)

```
                        PENDING enrollment
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
                 CHILD    GUARDIAN    SCHOOL
                 (children) (guardians) (schools)
                    │         │          │
                    │    ┌────┼────┐     │
                    │    ▼    ▼    ▼     │
                    │  STAFF ALUMNI GOVT │
                    │    │    │    │     │
                    └────┼────┼────┼─────┘
                         │    │    │
            ┌────────────┘    │    └────────────┐
            ▼                 ▼                 ▼
        ADDRESS           SIBLINGS          DOCUMENTS
        (addresses)       (per-app table)   (g1_documents)
            │
            ▼
    ┌──────────────┐
    │  distance_km │ → proximity score (50%)
    │  distance_band│
    └──────────────┘

    After COMPLETED:

    marks_breakdown calculated → total_marks
        │
        ▼
    PENDING_APPROVAL status
        │
        ▼
    APPROVED → creates student record:
        │
        ├── students table (new row)
        ├── student_join_addresses (link addresses to student)
        ├── student_join_guardians (link guardians to student)
        └── enrollment status → APPROVED
            │
            ▼
        ADMITTED (final)
```

---

## Step Progress Bar (Locked)

```
┌──────────────────────────────────────────────────────────────────┐
│  ① Child     ② Guardian    ③ School     ④ Address    ⑤ Siblings │
│    ✓ ───────────  ✓ ────────────  ⬤ ────────────  ○             │
│  ⑥ Documents  ⑦ Review & Lock                                    │
│    ○                                                              │
└──────────────────────────────────────────────────────────────────┘
```

- No revisiting completed steps to edit — only forward progression.
- Current step: active dot (blue ring).
- Completed: green checkmark.
- Future: gray dashed.
- Step 5 (Siblings): only visible if Category=Sibling declared in Step 2.
- Documents step: auto-calculates required types from Step 2 categories.

---

## Step 1: Child Profile

### Fields

| Field | Component | Validation |
|-------|-----------|------------|
| Full Name | `Input` | Required, ≥3 chars |
| Name with Initials | `Input` | Required |
| Date of Birth | `Calendar` + `Popover` | Required; ≤5 years before Jan 31 of batch year |
| Gender | `Select` | Required |
| Religion | `Select` | Optional |
| Nationality | `Select` | SriLankan/DualCitizen/Other |
| Birth Certificate No | `Input` | Optional |
| Photo | File + preview | JPG/PNG ≤2MB |

### Age Validation
```ts
const batchYear = 2027
const cutoff = new Date(batchYear, 0, 31) // Jan 31
const minDOB = new Date(cutoff.getFullYear() - 5, cutoff.getMonth(), cutoff.getDate())
// DOB must be ≤ minDOB
```

### Completion → Creates `children` record or links existing via lookup.

---

## Step 2: Guardian Profile + Scoring Categories

### Primary Guardian Fields

| Field | Component | Required |
|-------|-----------|----------|
| Relationship | `Select` (Father/Mother/Guardian) | Yes |
| Full Name | `Input` | Yes |
| NIC Number | `Input` | Yes (NIC format check) |
| Phone | `Input` | Yes |
| Email | `Input` | No |
| Occupation | `Input` | No |
| Workplace | `Input` | No |
| Workplace Address | `Textarea` | No |
| Income Level | `Input` (number) | No |

### Category Declaration (Checkboxes, 1 per guardian)

| Checkbox | Weight | Effect |
|----------|--------|--------|
| Close Resident | 50% | Always ON (automatic via address) |
| School Staff | 25% | Shows staff sub-form; locks to selected school later |
| Has Sibling in School | 14% | Unlocks Step 5 |
| Past Pupil (Alumni) | 6% | Shows alumni sub-form; locks to selected school |
| Govt Employee | 4% | Shows service years field |
| Special Circumstances | 1% | Shows disability/conflict fields |

### Conditional Sub-Forms

**Staff** → inline: Designation, Employment Type (Permanent/Temporary/Contract), Service Start Date.
**Alumni** → inline: Highest Grade (GCE_AL/GCE_OL/Grade_11/Grade_10/Below), Year Left, Left Reason.
**Govt** → inline: Service Years (affects raw score: ≥5→40, ≥10→60, ≥15→80, ≥20→100).
**Special** → inline: Disability checkbox (triggers DisabilityType field), Conflict Area checkbox, Single Parent checkbox.

### Optional: Second Guardian
Button "Add Guardian" below. Same fields + checkboxes. Max 2 guardians.

### Completion → Creates `guardians` record(s) + `g1_join_guardians` linking.

---

## Step 3: School Selection

### School Search
`Command` palette with filters: District, SchoolType, SchoolCategory.

### Selected School Card
Shows school name (SI+EN), type Badge, category Badge, quota Badge, address, mini map.

### Cross-validation (runs on step completion)
- Staff guardian → staff school must match selected school.
- Alumni guardian → alumni school must match selected school.
- Sibling → sibling school must match selected school (enforced in Step 5).

### Completion → Sets `enrollment.school_id`.

---

## Step 4: Address + Proximity

### Address Fields

| Field | Component | Required |
|-------|-----------|----------|
| Address Line 1 | `Input` | Required |
| Address Line 2 | `Input` | No |
| City | `Input` | Required |
| District | `Select` | Required |
| Province | `Select` | Required |
| GS Division | `Input` | Required |
| Postal Code | `Input` | No |
| Residence Type | `Select` | Owned/Rented/Relative/Other |
| Ownership Proof | `Select` | Deed/Lease/GN Certificate |

### Map Pin (Interactive)
Map centered on selected school. User taps to place residence pin → auto-fills lat/lon → Haversine distance calculated live.

### Distance Card
Shows real-time: distance (km), band (<0.5 / 0.5-1 / 1-2 / 2-3 / 3-5 / >5), raw proximity score, weighted (50%) score preview.

### Completion → Creates `addresses` record + `g1_join_addresses`.

---

## Step 5: Sibling Details

**Only visible if Category=Sibling was checked in Step 2.**

Direct fields per sibling (no join to student table):

| Field | Component | Required |
|-------|-----------|----------|
| Full Name | `Input` | Required |
| School | `Select` (disabled, = selected school) | Locked |
| Current Grade | `Input` number (1–13) | Required |
| Admission Year | `Input` (4-digit year) | No |
| Photo | File upload | No |
| Verification Doc | File upload | No |

### Sibling Scoring Preview
Live distance-based scoring using same bands as proximity.

### Completion → Creates sibling records directly.

---

## Step 6: Document Upload

### Auto-Calculated Required Types

| Category Declared | Required Documents |
|-------------------|--------------------|
| Always (base) | Birth Certificate, Guardian NIC |
| Close Resident | Residence Proof |
| Staff | Staff Appointment Letter, Staff Service Certificate |
| Sibling | Sibling School Certificate |
| Alumni | Past Pupil Certificate, Past Pupil Exam Certificate |
| Govt Employee | Govt Service Certificate |
| Special (Disability) | Disability Certificate |
| Religion (Buddhism/Catholicism/etc.) | Baptism Certificate |

### Document Card
Each required type renders as a Card with drop zone, file preview, upload progress. Status: uploaded ✅ or missing ⚠️.

### Upload Action
Upload via drop zone → creates `g1_documents` record with file_hash, file_size, verification_status=Pending.

### Completion Validation
All required types must be uploaded.

---

## Step 7: Review & Lock

### Layout
Full read-only summary — every section from Steps 1-6 displayed in cards. Estimated score preview with per-category weighted breakdown. Missing-docs banner if any.

### Lock Action
"Confirm & Complete" button → **AlertDialog**: "After completing, this enrollment cannot be edited. Are you sure?" → On confirm:
- Status → `COMPLETED`
- All data persisted
- Navigates to pipeline dashboard
- Toast: "Enrollment completed. Awaiting marks calculation."

### Save Draft (PENDING)
If user hasn't finished, a "Save Progress" button saves current step state. Enrollment remains `PENDING`. User can return to wizard at the last incomplete step.

### Exit
"Exit" → back to pipeline dashboard. Enrollment stays PENDING at current step. Card shows "Continue Wizard" action in pipeline dashboard.

---

## Wizard State Store

Local React context scoped to wizard route. Persists across step navigation. No server round-trips between steps — only on completion of each step or on Save Draft.

```tsx
interface WizardState {
  step: number                                // 1-7
  enrollmentId: string                        // from route param
  child: { full_name, date_of_birth, gender, religion, nationality, birth_cert_no, photo_url }
  guardians: Array<{
    tempId, relationship, full_name, nic, phone, email,
    occupation, workplace, workplace_address, income,
    is_staff, staff_designation, staff_employment_type, staff_service_start,
    is_alumni, alumni_highest_grade, alumni_year_left, alumni_left_reason,
    is_govt_employee, govt_service_years,
    is_special, disability, conflict_area, single_parent
  }>
  school: { school_id, school_name_si, school_type, category, quota }
  address: { line1, line2, city, district, province, gs_division, postal_code, residence_type, ownership_proof, lat, lon, distance_km, distance_band }
  siblings: Array<{ tempId, sibling_name, current_grade, admission_year, photo_url, verification_doc }>
  documents: Array<{ tempId, doc_type, file, file_url, status }>
  completed: boolean                          // READ_ONLY after true
}
```

---