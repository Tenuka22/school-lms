# Pipeline Dashboard

## Route
`/student-management/enrollment/g1`
> File: `apps/web/src/routes/_authenticated/student-management/enrollment/g1/index.tsx`

---

## Concept: Kanban-Style Status Lanes

Instead of a standard data table with a status dropdown, the dashboard renders as **horizontal status lanes** (columns), each representing a pipeline stage. Enrollment cards move across lanes as their status progresses. Users **cannot** manually drag or change status — transitions happen only through the pipeline actions (wizard completion, mark calculation, approval).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Grade 1 Admissions Pipeline                          [Batch: 2027 ▼] [+ New] │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │PENDING │ │COMPLETED│ │PENDING_APPRVL│ │ APPROVED │ │ ADMITTED │ │REJECTED││
│  │  12    │ │   34    │ │     18       │ │   22     │ │   15     │ │   8    ││
│  └────────┘ └────────┘ └──────────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐
│  │ PENDING  │ │COMPLETED │ │PENDING_APPROV│ │ APPROVED │ │ ADMITTED │ │REJECT│
│  │          │ │          │ │              │ │          │ │          │ │ED    │
│  │ ┌──────┐ │ │ ┌──────┐ │ │ ┌──────────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │┌────┐│
│  │ │Card 1│ │ │ │Card 1│ │ │ │ Card 1   │ │ │ │Card 1│ │ │ │Card 1│ │ ││Card││
│  │ │N.Perera│ │ │S.Silva│ │ │ │A.Fernando│ │ │ │W.De  │ │ │ │K.Raj │ │ ││K.  ││
│  │ │       │ │ │ │       │ │ │ │Marks:92.5│ │ │ │Silva │ │ │ │      │ │ ││Guna││
│  │ └──────┘ │ │ │ └──────┘ │ │ │ ▼ Rank#2 │ │ │ └──────┘ │ │ └──────┘ │ │ │└────┘│
│  │          │ │ │          │ │ │ └──────────┘ │ │          │ │          │ │ │    │
│  │ ┌──────┐ │ │ │ ┌──────┐ │ │ │ ┌──────────┐ │ │ ┌──────┐ │ │ ┌──────┐ │ │ │┌────┐
│  │ │Card 2│ │ │ │ │Card 2│ │ │ │ │ Card 2   │ │ │ │Card 2│ │ │ │Card 2│ │ │ ││Card│
│  │ │M.Pathir│ │ │ │K.Dias │ │ │ │ │M.Perera  │ │ │ │P.Jay │ │ │ │S.Fern│ │ │ ││J. │
│  │ │       │ │ │ │ │       │ │ │ │ │Marks:87.3│ │ │ │      │ │ │ │      │ │ │ ││Perera
│  │ └──────┘ │ │ │ └──────┘ │ │ │ │ ▼ Rank#6 │ │ │ └──────┘ │ │ └──────┘ │ │ │ │└────┘
│  │          │ │ │          │ │ │ │ └──────────┘ │ │          │ │          │ │ │    │
│  │ ┌──────┐ │ │ │          │ │ │ │ ┌──────────┐ │ │          │ │          │ │ │    │
│  │ │Card 3│ │ │ │          │ │ │ │ │ Card 3   │ │ │          │ │          │ │ │    │
│  │ │...    │ │ │ │          │ │ │ │ │ ...      │ │ │          │ │          │ │ │    │
│  │ └──────┘ │ │ │          │ │ │ │ └──────────┘ │ │          │ │          │ │ │    │
│  │          │ │ │          │ │ │              │ │          │ │          │ │ │    │
│  └──────────┘ └──────────┘ └──────────────┘ └──────────┘ └──────────┘ └──────┘
│                                                                               │
│  "Complete wizard to → COMPLETED"         "Actions trigger transitions"       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Lane Implementation

Each lane is a vertical `Card` with a header (status name + count Badge) and a scrollable list of enrollment cards.

```tsx
const lanes = [
  { status: 'PENDING',           label: 'Pending',          color: 'bg-amber-100 dark:bg-amber-950', badge: 'secondary' },
  { status: 'COMPLETED',         label: 'Completed',        color: 'bg-blue-100 dark:bg-blue-950',   badge: 'default' },
  { status: 'PENDING_APPROVAL',  label: 'Pending Approval', color: 'bg-purple-100 dark:bg-purple-950', badge: 'default' },
  { status: 'APPROVED',          label: 'Approved',         color: 'bg-emerald-100 dark:bg-emerald-950', badge: 'default' },
  { status: 'ADMITTED',          label: 'Admitted',         color: 'bg-green-100 dark:bg-green-950', badge: 'default' },
  { status: 'REJECTED',          label: 'Rejected',         color: 'bg-red-100 dark:bg-red-950',    badge: 'destructive' },
]

<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
  {lanes.map((lane) => (
    <div key={lane.status} className={cn("rounded-xl p-3", lane.color)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{lane.label}</h3>
        <Badge variant={lane.badge}>{counts[lane.status]}</Badge>
      </div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {enrollments[lane.status].map((enr) => (
          <PipelineCard key={enr.id} enrollment={enr} />
        ))}
        {enrollments[lane.status].length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No enrollments</p>
        )}
      </div>
    </div>
  ))}
</div>
```

---

## Pipeline Card

Each card is clickable and shows key info inline. **No edit/delete buttons.** Actions depend on lane context.

```tsx
<Card
  className="p-3 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
  onClick={() => navigate({ to: `/$id` })}
>
  <div className="text-xs text-muted-foreground font-mono">
    {enrollment.reference_no || '—'}
  </div>
  <div className="font-medium text-sm mt-0.5 truncate">
    {enrollment.child?.full_name || '—'}
  </div>
  <div className="flex items-center gap-1 mt-1">
    {enrollment.school && (
      <Badge variant="outline" className="text-[10px] px-1 py-0">
        {enrollment.school.school_name_si?.slice(0, 12) || '—'}
      </Badge>
    )}
  </div>

  {lane.status === 'PENDING_APPROVAL' && (
    <div className="flex items-center gap-1 mt-2 text-xs font-mono">
      <span className="text-muted-foreground">Marks:</span>
      <span className="font-bold">{enrollment.total_marks?.toFixed(2)}</span>
    </div>
  )}

  <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground">
    <span>{formatDateShort(enrollment.created_at)}</span>
    {enrollment.doc_count != null && (
      <span>{enrollment.doc_count} docs</span>
    )}
  </div>
</Card>
```

---

## Action Context Bar

Below the lanes, a contextual action bar appears when cards are selected or hovered (lane-specific):

| Lane | Available Action | |
|------|-----------------|---|
| PENDING | **Continue Wizard** → `/$id` | (opens wizard at current step) |
| PENDING | **Withdraw** (AlertDialog) → status=WITHDRAWN | |
| COMPLETED | **Calculate Marks** (admin-only) → triggers → PENDING_APPROVAL | |
| COMPLETED | **WITHDRAWN** (manual) | |
| PENDING_APPROVAL | **Review** → `/applications/$id` | |
| APPROVED | **View Student** → link to student record | |
| ADMITTED | **View Student** | |
| REJECTED | **View Reason** (Tooltip on card) | |

---

## Dashboard Top Banner

```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Grade 1 Admissions Pipeline</h1>
    <p className="text-sm text-muted-foreground mt-1">
      {totalCount} enrollments across {batchYear} batch
    </p>
  </div>
  <div className="flex items-center gap-3">
    <Select value={batchYear} onValueChange={setBatchYear}>
      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
      <SelectContent>{yearOptions}</SelectContent>
    </Select>
    <Button onClick={() => navigate({ to: '/new' })}>
      <Plus className="size-4 mr-2" /> New Enrollment
    </Button>
  </div>
</div>
```

---

## "New Enrollment" — Entry Point (Imperative)

The `+ New Enrollment` button opens **`G1EnrollmentDialog`** (modified from `g1-enrollment-dialog.tsx`):

```diff
- defaultValues.enrollment_status: "Draft" | ...
+ defaultValues.enrollment_status: "PENDING"  (LOCKED - no dropdown, auto-set)
```

The dialog asks for:
- **Full Name** (child)
- **Batch Year** (auto: current year)
- **Gender**
- **Medium of Instruction**
- **Category** (preliminary — dictates wizard steps)

On submit: enrollment created with `status = PENDING`, auto-generates `reference_no`. Immediately **navigates to `/$new-id`** which opens the wizard at Step 1. No "Cancel and stay on dashboard" — the user is pushed into the wizard flow. A toast says "Enrollment created. Complete the details now."

```tsx
onSubmit: async ({ value }) => {
  const result = await createEnrollment({
    body: {
      ...value,
      id: crypto.randomUUID(),
      enrollment_status: 'PENDING', // forced, no dropdown
    }
  })
  toast.success("Enrollment created. Complete all details.")
  onOpenChange(false)
  // Navigate to wizard IMMEDIATELY
  navigate({ to: `/student-management/enrollment/g1/${result.id}` })
}
```

---