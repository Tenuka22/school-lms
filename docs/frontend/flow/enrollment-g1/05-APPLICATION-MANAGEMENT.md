# Application Management & Approval

## Route
`/student-management/enrollment/g1/applications`
> File: `apps/web/src/routes/_authenticated/student-management/enrollment/g1/applications.tsx`

---

## Purpose

This is the **approval queue** — where `PENDING_APPROVAL` applications are ranked **descending by total_marks** and officers decide which to approve, creating actual student records.

Only enrollments with `status = PENDING_APPROVAL` appear here. (Future: COMPLETED may appear with "Calculate Marks" action.)

---

## Entity Data Flow at Approval

```
APPROVED action triggers:

┌─────────────────────────────────────────────────────────────┐
│  enrollment.guardian_id ──► students (new row created)      │
│                                                             │
│  1. INSERT INTO students:                                   │
│     - full_name = enrollment.child.full_name               │
│     - date_of_birth = enrollment.child.date_of_birth       │
│     - gender, religion, nationality from child            │
│     - medium_of_instruction from enrollment               │
│     - current_grade = 1                                     │
│     - admission_date = now()                                │
│     - status = Active                                       │
│     - admission_number = auto-generated                    │
│                                                             │
│  2. INSERT INTO student_join_guardians:                     │
│     - student_id → new student                              │
│     - guardian_id → enrollment's guardian(s)               │
│     - relationship + is_primary from g1_join_guardians     │
│                                                             │
│  3. INSERT INTO student_join_addresses:                     │
│     - student_id → new student                              │
│     - address_id → enrollment's address(es)                │
│     - address_type + is_primary from g1_join_addresses     │
│                                                             │
│  4. UPDATE enrollment:                                      │
│     - status → APPROVED                                     │
│     - finalized_at = now()                                  │
│                                                             │
│  5. INSERT INTO g1_audit (action: "APPROVE")               │
└─────────────────────────────────────────────────────────────┘
```

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Application Management                                    [Batch: 2027 ▼]│
│  Applications pending approval — sorted by marks (highest first)       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Quota Preview: Royal College (Quota: 40)                           │ │
│  │  Approved: 22 · Pending: 18 · Remaining: 0 (oversubscribed)        │ │
│  │  ████████████████████████████████████████░░░░░░░░░░░░░░░░           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Data Table (sorted by marks DESC)                 [School: All ▼] │ │
│  │                                                                     │ │
│  │  Rank  Ref#     Child        School       Marks   Status    Actns   │ │
│  │  ─────────────────────────────────────────────────────────────────── │ │
│  │  #1    G1-001  N. Perera    Royal Col    95.00   P.Aprvl  [Review] │ │
│  │  #2    G1-002  S. Silva     Visakha      92.50   P.Aprvl  [Review] │ │
│  │  #3    G1-003  A. Fernando  Royal Col    90.25   P.Aprvl  [Review] │ │
│  │  #4    G1-004  M. Pathirana Visakha      89.80   P.Aprvl  [Review] │ │
│  │  #5    G1-005  K. Dias      Royal Col    87.30   P.Aprvl  [Review] │ │
│  │  ...                                                               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Table

Uses existing `DataTable` + `DataTableToolbar` pattern. Columns:

| Column | Accessor | Type | Notes |
|--------|----------|------|-------|
| Rank | rank_number | number | School-scoped numeric rank |
| Reference No | reference_no | text | |
| Child Name | child.full_name | text | |
| School | school.school_name_si | text | |
| Category | category_label | badge | Shows primary scoring category |
| Total Marks | total_marks | number | Bold, monospace font |
| Date Submitted | completed_at | date | When COMPLETED status reached |
| Status | status | badge | |
| Actions | — | button | **Review** → `/applications/$id` |

### Default Sort
**`total_marks DESC`** — locked. Users cannot change this sort. Secondary sort: `completed_at ASC` (tiebreaker).

### Filters
- School: `Select`
- Category: `Select` (CloseResident, Staff, Sibling, etc.)
- Marks Range: min/max `Input` (optional)

### Quota Progress Bar (top banner)
When a school is selected, show quota utilization:

```tsx
<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
  <div className="flex-1">
    <p className="text-sm font-medium">{selectedSchool.school_name_si}</p>
    <div className="h-3 bg-muted rounded-full overflow-hidden mt-1 flex">
      <div className="h-full bg-green-500" style={{ width: `${approvedPct}%` }} />
      <div className="h-full bg-amber-400" style={{ width: `${pendingApprovalPct}%` }} />
      <div className="h-full bg-muted-foreground/20" style={{ width: `${rejectedPct}%` }} />
    </div>
    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500" /> Approved: {approvedCount}</span>
      <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-400" /> Pending: {pendingCount}</span>
      <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-400" /> Rejected: {rejectedCount}</span>
    </div>
  </div>
  <Badge variant="secondary">Quota: {selectedSchool.grade_1_quota}</Badge>
</div>
```

---

## Application Detail Page

### Route
`/student-management/enrollment/g1/applications/$enrollment-id`

### Layout
```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Applications                                          │
│                                                                   │
│  Application #G1-2027-00042 · Nimal Perera                       │
├──────────────────────────────────────────────────────────────────┤
│  Tabs: [Overview] [Documents] [Marks] [Audit] [Appeal]           │
├──────────────────────────────────────────────────────────────────┤
│  (Tab content)                                                    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  Approval Panel (always visible at bottom for PENDING_APPROVAL)││
│  │                                                               ││
│  │  [Approve → Creates Student]                  [Reject]        ││
│  │  ┌──────────────────────────────────────────────────────┐    ││
│  │  │ Approve this applicant?                              │    ││
│  │  │ This will:                                           │    ││
│  │  │  ✓ Create a student record                           │    ││
│  │  │  ✓ Assign admission number                           │    ││
│  │  │  ✓ Link guardians & addresses to student             │    ││
│  │  │  ✓ Set enrollment status to APPROVED                 │    ││
│  │  │                                                      │    ││
│  │  │ [Cancel]         [Confirm Approval]                  │    ││
│  │  └──────────────────────────────────────────────────────┘    ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Overview Tab (Read-Only Review)
Same layout as wizard Step 7 Review — all fields rendered in Cards, read-only. Includes score breakdown.

### Documents Tab
Grid of uploaded documents (from wizard Step 6), read-only with verification status badges.

### Marks Tab
Radar chart + per-category breakdown cards. Total marks banner with rank and list_category.

### Audit Tab
Timeline + JSON diff viewer (same as `07-AUDIT.md`).

### Appeal Tab
Appeal timeline + file new appeal form (same as `08-APPEAL.md`).

---

## Approval Action

Only visible when `status = PENDING_APPROVAL`. Requires officer/admin role.

### Approve → Confirm Dialog

```tsx
<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Approve Application</AlertDialogTitle>
      <AlertDialogDescription asChild>
        <div className="space-y-2 text-sm">
          <p>This will create a permanent student record for:</p>
          <div className="bg-muted p-3 rounded-lg">
            <p className="font-medium">{application.child.full_name}</p>
            <p className="text-xs text-muted-foreground">
              DOB: {application.child.date_of_birth} · School: {application.school.school_name_si}
            </p>
            <p className="text-xs text-muted-foreground">
              Total Marks: {application.total_marks} · Rank: #{application.rank_number}
            </p>
          </div>
          <ul className="list-disc list-inside text-xs text-muted-foreground">
            <li>Student record created in system</li>
            <li>Guardians & addresses linked to student</li>
            <li>Enrollment finalized as APPROVED</li>
            <li>This action is logged in audit trail</li>
          </ul>
        </div>
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleApprove}>
        {approving ? <LoaderCircle className="size-4 animate-spin mr-2" /> : null}
        Confirm Approval
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### On Successful Approval
- Enrollment status → `APPROVED`
- Student record created
- Redirect back to `/applications`
- Toast: "Application approved. Student record created."

### Reject Action
Similar `AlertDialog` with required `Textarea` for rejection reason. Sets status to `REJECTED`. Creates audit.

---

## After Approval — What Changes

- Enrollment moves from PENDING_APPROVAL lane to APPROVED lane in the pipeline dashboard.
- A new `students` table row exists.
- The student appears in the Student Management section.
- The enrollment can later be moved to `ADMITTED` via admissions list finalization.

---