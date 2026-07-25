# G1 Admission Enrollment — Route Map (Implemented)

## Route Architecture (TanStack Router file-based)

```
apps/web/src/routes/_authenticated/student-management/enrollment/g1/
├── index.tsx                            # Pipeline Dashboard (data table + status lanes)
├── enrollment/
│   └── g1/
│       ├── index.tsx                    # Pipeline Dashboard (re-exported via index)
│       ├── $enrollment_id.tsx           # Enrollment Wizard (6-step)
│       └── scoring.$enrollment_id.tsx   # Scoring & Marks Dashboard
```

## Full URL Space

| Route                                                              | Component | Purpose                                      |
|--------------------------------------------------------------------|-----------|----------------------------------------------|
| `/_authenticated/student-management/`                              | `StudentManagement` | Landing page                              |
| `/_authenticated/student-management/enrollment/g1/`                | `PipeDashboard` | Pipeline dashboard — batch, enrollments, filters |
| `/_authenticated/student-management/enrollment/g1/$enrollment_id`  | `WizardShell` | 6-step enrollment wizard                    |
| `/_authenticated/student-management/enrollment/g1/scoring/$id`     | `ScoringDashboard` | Scoring breakdown and marks calculation     |

## Not Yet Implemented (planned but not built)

| Planned Route | Purpose |
|---------------|---------|
| `/student-management/enrollment/g1/applications` | Application approval queue (ranked by marks) |
| `/student-management/enrollment/g1/applications/$id` | Application detail + Approve/Reject |
| `/student-management/enrollment/g1/applications/$id/documents` | Document review (read-only) |
| `/student-management/enrollment/g1/applications/$id/marks` | Marks breakdown (radar chart) |
| `/student-management/enrollment/g1/applications/$id/audit` | Audit trail per application |
| `/student-management/enrollment/g1/applications/$id/appeal` | Appeal history |
| `/student-management/enrollment/g1/lists` | Final admission lists (Main/Waiting/Rejected) |
| `/student-management/enrollment/g1/settings` | Quotas, weights, distance bands |

---

## Navigation Flow (Current Implementation)

```
Pipeline Dashboard
  │
  ├─► Select Batch → view enrollments in status lanes
  │     │
  │     ├─► [+ New Enrollment] → dialog → creates PENDING enrollment → navigates to Wizard
  │     │
  │     ├─► Click enrollment name → navigates to Wizard (/$enrollment_id)
  │     │     │
  │     │     └─► Wizard: Child → Guardian → Address → Siblings → Documents → Review & Lock
  │     │           │
  │     │           └─► On completion: status = COMPLETED, enrollment locked
  │     │
  │     └─► Scoring link → /scoring/$enrollment_id
  │           │
  │           └─► [Calculate Marks] → computes weighted total
  │
  └─► [Applications Queue] — NOT YET IMPLEMENTED
  └─► [Admission Lists] — NOT YET IMPLEMENTED
```

---

## Breadcrumb Conventions

```
Student Management > Enrollment > G1 > Dashboard
Student Management > Enrollment > G1 > New Enrollment
Student Management > Enrollment > G1 > Enrollment #REF123 (Wizard)
Student Management > Enrollment > G1 > Applications
Student Management > Enrollment > G1 > Application #REF123 → Marks
Student Management > Enrollment > G1 > Lists
```

---

## Component Hierarchy (Current)

```
apps/web/src/components/enrollment/g1/
├── pipeline/
│   ├── pipeline-dashboard.tsx          # Pipeline dashboard (batch + data table + lanes)
│   └── pipeline-card.tsx               # Enrollment card within a lane
├── wizard/
│   ├── wizard-shell.tsx                # Master wizard (step controller)
│   ├── wizard-step-child.tsx           # Step 1: Child Profile
│   ├── wizard-step-guardian.tsx        # Step 2: Guardian + Categories
│   ├── wizard-step-address.tsx         # Step 3: Address
│   ├── wizard-step-siblings.tsx        # Step 4: Siblings
│   ├── wizard-step-documents.tsx       # Step 5: Document Upload
│   ├── wizard-step-review.tsx          # Step 6: Review & Lock
│   ├── wizard-sidebar.tsx              # Step navigation sidebar
│   ├── sibling-selector.tsx            # Reusable sibling picker
│   ├── guardian-selector.tsx           # Reusable guardian picker
│   └── address-selector.tsx            # Reusable address picker
├── scoring/
│   └── scoring-dashboard.tsx           # Scoring & marks breakdown
├── g1-enrollment-dialog.tsx            # Quick create enrollment dialog
├── g1-data-grid.tsx                    # Data table (shared)
└── create-batch-dialog.tsx             # Batch creation dialog
```

## Component Usage Matrix (Shadcn)

| Component          | Wizard | Dashboard | Scoring |
|--------------------|--------|-----------|---------|
| Card               | x      | x         | x       |
| Badge              | x      | x         | x       |
| Button             | x      | x         | x       |
| Dialog             | x      | x         |         |
| DataTable          |        | x         |         |
| Input              | x      | x         |         |
| Select             | x      | x         |         |
| Calendar           | x      | x         |         |
| Popover            | x      |           |         |
| Tooltip            | x      | x         |         |
| AlertDialog        | x      | x         |         |
| DropdownMenu       |        | x         |         |
| ScrollArea         |        | x         |         |
| Field+FieldGroup   | x      |           |         |
| Separator          |        |           | x       |

---