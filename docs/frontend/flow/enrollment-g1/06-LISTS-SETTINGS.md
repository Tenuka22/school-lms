# Admission Lists & Settings

## Route
`/student-management/enrollment/g1/lists`
> File: `apps/web/src/routes/_authenticated/student-management/enrollment/g1/lists.tsx`

## Route
`/student-management/enrollment/g1/settings`
> File: `apps/web/src/routes/_authenticated/student-management/enrollment/g1/settings.tsx`

---

## Admission Lists

### Data Source
`admission_lists` table — populated after marks calculation and approval. Each entry links an application to a school with list_type (MainList/WaitingList/RejectedList) and position_number.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Admission Lists                          [Batch: 2027 ▼]        │
│                           [School: Royal College ▼]               │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                            │
│  │Quota │ │Main  │ │Wtng  │ │Rejctd│                            │
│  │  40  │ │ 40   │ │ 20   │ │ 96   │                            │
│  └──────┘ └──────┘ └──────┘ └──────┘                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Quota Breakdown                                              │ │
│  │ Main (40): ████████████████████████████████████████████████ │ │
│  │ General: 20 ▐ Staff: 8 ▐ Distance: 10 ▐ SpecialNeeds: 2     │ │
│  └──────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│  [Main List] [Waiting List] [Rejected]                            │
├──────────────────────────────────────────────────────────────────┤
│  Main List                                                        │
│  Pos│ Ref#    │ Child    │ DOB      │ Category  │ Marks │ Status  │
│  ───┼─────────┼──────────┼──────────┼───────────┼───────┼─────────│
│  #1 │ G1-001  │ N.Perera │ 2022-01  │ Staff+Sib │ 95.00 │ Approved│
│  #2 │ G1-003  │ A.Fern   │ 2022-02  │ Proximity │ 90.25 │ Approved│
│  #3 │ G1-005  │ K.Dias   │ 2022-03  │ Sibling   │ 87.30 │ Approved│
│  ...                                                                 │
│                                                                      │
│  [Export PDF] [Export Excel]                                         │
└──────────────────────────────────────────────────────────────────┘
```

### Quota Visualization Bar

4-segment horizontal bar colored by QuotaCategory:

| Category | Color | Source |
|----------|-------|--------|
| General | #3B82F6 (blue) | Proximity |
| Staff | #22C55E (green) | Staff children |
| Distance | #8B5CF6 (purple) | Close residents |
| SpecialNeeds | #EC4899 (pink) | Disability/etc. |

```tsx
<div className="h-4 bg-muted rounded-full overflow-hidden flex">
  {segments.map((seg) => (
    <Tooltip key={seg.category} content={`${seg.label}: ${seg.count} seats`}>
      <div className="h-full" style={{ width: `${seg.pct}%`, backgroundColor: seg.color }} />
    </Tooltip>
  ))}
</div>
```

### Three Tabbed Data Tables

Each uses `DataTable` with identical columns, filtered by list_type:

| Column | Accessor |
|--------|----------|
| Position | position_number (or waiting_position) |
| Reference No | reference_no |
| Child Name | child.full_name |
| Date of Birth | date_of_birth |
| Primary Category | quota_category label |
| Total Marks | total_marks |
| Status | status (badge) |

### Export
Download button → generates CSV or PDF of the currently visible list.

---

## Settings Page

### Access
Admin only. All setting changes logged to audit.

### Sections

```
┌──────────────────────────────────────────────────────────────────┐
│  G1 Admission Settings                                            │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ School Quotas               │ │ Scoring Weights (%)         │ │
│  │                             │ │ Must total 100%             │ │
│  │ School A: [____] seats      │ │ Proximity:  [____] 50       │ │
│  │ School B: [____] seats      │ │ Staff:      [____] 25       │ │
│  │ School C: [____] seats      │ │ Sibling:    [____] 14       │ │
│  │                             │ │ Alumni:     [____] 6        │ │
│  └─────────────────────────────┘ │ Govt:       [____] 4        │ │
│                                   │ Special:    [____] 1        │ │
│  ┌─────────────────────────────┐ │ Total:      100  [Save]     │ │
│  │ Distance Bands (raw marks)  │ └─────────────────────────────┘ │
│  │ <0.5km: [____] 100          │                                  │
│  │ 0.5-1:  [____] 80           │ ┌─────────────────────────────┐ │
│  │ 1-2:    [____] 60           │ │ Reserved Minimums            │ │
│  │ 2-3:    [____] 40           │ │ Staff seats: [____] 5        │ │
│  │ 3-5:    [____] 20           │ │ SpecialNeeds: [____] 1       │ │
│  │ >5km:   [____] 10           │ └─────────────────────────────┘ │
│  └─────────────────────────────┘                                  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Time Windows                                                 │ │
│  │ Application: [DatePicker] to [DatePicker]                    │ │
│  │ Doc Re-submission: [____] days   Appeal: [____] days        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  [Save All Settings] — changes logged to g1_audit                 │
└──────────────────────────────────────────────────────────────────┘
```

### Weight Validation
All 6 weights must sum to exactly 100. Red indicator if not.

### Quota Validation
Each school quota must be ≥35 (legal minimum per circular Section 4.1).

---