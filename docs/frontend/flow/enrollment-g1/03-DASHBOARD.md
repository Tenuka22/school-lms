# Pipeline Dashboard

## Route
`/_authenticated/student-management/enrollment/g1/`
> File: `apps/web/src/components/enrollment/g1/pipeline/pipeline-dashboard.tsx`

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Grade 1 Admissions Pipeline                           [+ New Enrollment]  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Batch Selector (horizontal scrollable cards)                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  [+ New Batch]                         │
│  │ 2027    │ │ 2026    │ │         │                                         │
│  │ ●○○○○   │ │ ○○○○○   │ │         │   (weight distribution bar)           │
│  │ 200 seats│ │ 150 seats│ │         │                                         │
│  └─────────┘ └─────────┘ └─────────┘                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  Status Lane Summary Cards (grid: 6 columns)                                │
│  ┌────────┐ ┌────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │PENDING │ │COMPLETED│ │PENDING_APPRVL│ │ APPROVED │ │ ADMITTED │ │REJECTED││
│  │  12    │ │   34    │ │     18       │ │   22     │ │   15     │ │   8    ││
│  └────────┘ └────────┘ └──────────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                                               │
│  Data Table (TanStack Table)                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [Search...] [Filters ▼] [Column visibility ▼]                   [Rows] │ │
│  │                                                                         │ │
│  │ Full Name │ Initials │ DOB │ Gender │ Nationality │ Category │ Medium  │ │
│  │ Status │ Marks │ Created │ Actions                                      │ │
│  │ ─────────────────────────────────────────────────────────────────────── │ │
│  │ N. Perera  │ N.Perera │ ... │ Male   │ SriLankan  │ Close... │ Sinhala │ │
│  │ S. Silva   │ S.Silva  │ ... │ Female │ DualCitizen│ Staff   │ Tamil   │ │
│  │ ...                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

> Note: The design docs describe a kanban-style view with draggable status lane columns. The current implementation uses **status lane summary cards** (counts only) above a **server-side data table** with column filtering, sorting, and pagination. Cards are not draggable.

---

## Batch Selector

Batches are displayed as horizontal scrollable cards. Each card shows:
- Year
- Status badge
- Seat allocation
- Weight distribution bar (6 color segments: proximity, staff, sibling, alumni, govt, special)

A "New Batch" button opens a dialog to create a batch with year, total student allocation, and weight distribution.

---

## Status Lane Summary Cards

Six cards in a grid showing enrollment counts per status:

| Status | Badge Variant | Description |
|--------|--------------|-------------|
| Pending | secondary | Data entry in progress |
| Completed | default | Data entered, ready for marks |
| PendingApproval | default | Awaiting officer approval |
| Approved | default | Approved |
| Admitted | default | Formally admitted |
| Rejected | destructive | Not selected |

---

## Data Table

Uses TanStack Table with **manual** server-side filtering, sorting, and pagination.

### Columns

| Column | Filterable | Sortable | Description |
|--------|-----------|----------|-------------|
| Full Name | Yes (text) | Yes | Clickable → navigates to wizard |
| Initials | Yes (text) | Yes | Name with initials |
| DOB | No | No | Date of birth |
| Gender | Yes (select) | Yes | Male / Female |
| Nationality | Yes (select) | Yes | SriLankan, DualCitizen, Other |
| Category | Yes (select) | Yes | 7 categories |
| Medium | Yes (select) | Yes | Sinhala, Tamil |
| Status | Yes (select) | Yes | All enrollment statuses |
| Marks | No | No | Calculated score (color-coded) |
| Created | No | Yes | Creation timestamp |
| Actions | — | — | View, Configure, Delete |

### Creating an Enrollment

1. Select a batch.
2. Click "New Enrollment" → dialog with child details (full name, initials, DOB, gender, nationality, medium, religion).
3. On submit: enrollment created with `enrollment_status: Pending`, navigates to wizard at `/$enrollment_id`.

### Marks Display

Marks are color-coded: green (≥75), amber (≥50), red (<50). Shown only when `total_marks > 0`.

---