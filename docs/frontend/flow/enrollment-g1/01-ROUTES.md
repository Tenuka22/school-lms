# G1 Admission Enrollment — Route Map (Imperative Pipeline)

## Route Architecture (TanStack Router file-based)

```
apps/web/src/routes/_authenticated/student-management/enrollment/g1/
├── index.tsx                            # Pipeline Dashboard (status-lane view)
├── new.tsx                              # Create enrollment (→ auto PENDING, → wizard)
├── $enrollment-id.tsx                   # Wizard (imperative flow, locked steps)
├── applications.tsx                     # Application Management (ranked, marks descending)
├── applications.$enrollment-id.tsx      # Application Detail (read-only review + approve)
├── lists.tsx                            # Final Admission Lists (quota-based)
├── settings.tsx                         # School quotas, scoring weights, distance bands
```

## Full URL Space

| Route                                                              | Who sees it         | Purpose                                      |
|--------------------------------------------------------------------|---------------------|----------------------------------------------|
| `/student-management/enrollment/g1`                                | All roles           | Dashboard with status pipeline lanes          |
| `/student-management/enrollment/g1/new`                            | Zonal Officer       | Create enrollment → auto PENDING → wizard     |
| `/student-management/enrollment/g1/$id`                            | Zonal Officer       | Imperative wizard to fill enrollment data     |
| `/student-management/enrollment/g1/applications`                   | Officer, Admin      | Application approval queue (ranked by marks)  |
| `/student-management/enrollment/g1/applications/$id`               | Officer, Admin      | Application detail + Approve/Reject actions   |
| `/student-management/enrollment/g1/applications/$id/documents`     | Officer             | Document review (read-only docs from wizard)  |
| `/student-management/enrollment/g1/applications/$id/marks`         | Officer, Admin      | Marks breakdown (radar + category scores)     |
| `/student-management/enrollment/g1/applications/$id/audit`        | Admin               | Full audit trail per application              |
| `/student-management/enrollment/g1/applications/$id/appeal`        | Officer, Admin      | Appeal history + file new appeal              |
| `/student-management/enrollment/g1/scoring/$enrollment_id`         | Admin               | Category scoring & marks breakdown dashboard  |
| `/student-management/enrollment/g1/lists`                          | All roles           | Final admission lists (Main/Waiting/Rejected) |
| `/student-management/enrollment/g1/settings`                       | Admin               | Quotas, weights, distance bands               |

---

## Navigation Flow (User Perspective)

```
Dashboard
  │
  ├─► [+ New Enrollment] → modal dialog → status = PENDING → → → Wizard (/$id)
  │                                                                     │
  │                                      ┌──────────────────────────────┘
  │                                      ▼
  │                              Wizard fills: Child → Guardian → School
  │                                   → Address → Siblings → Documents
  │                                      │
  │                                      ▼ status = COMPLETED
  │                              [Mark Calculation] (auto/triggered)
  │                                      │
  │                                      ▼ status = PENDING_APPROVAL
  │                              ┌──── [Applications Queue] ←─────┘
  │                              │
  │                              ▼ (sorted by marks DESC)
  │                    Officer reviews → Approve → creates Student record
  │                                        │
  │                                        ▼ status = APPROVED
  │                              ┌── [Admission Lists] ←──┘
  │                              ▼
  │                    Finalize → ADMITTED
  │
  ├─► [Applications Queue] → PENDING_APPROVAL → approve → APPROVED
  └─► [Admission Lists] → view final Main/Waiting/Rejected
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

## Component Hierarchy (Revised)

```
apps/web/src/components/enrollment/g1/
├── pipeline/
│   ├── pipeline-dashboard.tsx          # Status lanes with cards
│   ├── pipeline-lane.tsx               # Single status lane column
│   ├── pipeline-card.tsx               # Enrollment card within a lane
│   └── pipeline-stats.tsx              # Top stats bar
├── wizard/
│   ├── wizard-shell.tsx                # Master wizard (step controller)
│   ├── wizard-step-child.tsx           # Step 1: Child Profile
│   ├── wizard-step-guardian.tsx        # Step 2: Guardian + Categories
│   ├── wizard-step-school.tsx          # Step 3: School Selection
│   ├── wizard-step-address.tsx         # Step 4: Address + Map Pin
│   ├── wizard-step-siblings.tsx        # Step 5: Sibling Details
│   ├── wizard-step-documents.tsx       # Step 6: Document Upload
│   └── wizard-step-review.tsx          # Step 7: Review & Lock
├── applications/
│   ├── application-queue.tsx           # Ranked data grid (marks ↓)
│   ├── application-detail.tsx          # Read-only detail + Approve/Reject
│   ├── application-marks.tsx           # Radar + breakdown
│   ├── application-documents.tsx       # Document list (read-only)
│   └── application-approval.tsx        # Approval confirmation dialog
├── lists/
│   ├── admission-lists.tsx             # Main/Waiting/Rejected tables
│   ├── admission-list-tabs.tsx         # Tab switcher
│   └── admission-quota-bar.tsx         # Quota visualization
├── settings/
│   ├── settings-quotas.tsx             # School quota configuration
│   ├── settings-weights.tsx            # Scoring weight configuration
│   └── settings-bands.tsx              # Distance bands configuration
├── shared/
│   ├── enrollment-status-badge.tsx     # Pipeline status badge
│   ├── marks-breakdown-card.tsx        # Reusable category score card
│   ├── document-card.tsx               # Document with verification badge
│   ├── guardian-card.tsx               # Guardian info card
│   ├── school-card.tsx                 # School info card
│   ├── address-card.tsx                # Address + distance card
│   ├── sibling-card.tsx                # Sibling info card
│   ├── map-pin.tsx                     # Interactive map pin selector
│   └── audit-diff.tsx                  # JSON diff viewer
├── g1-enrollment-dialog.tsx            # [MODIFIED] Quick create → PENDING → wizard
├── g1-create-batch-dialog.tsx          # [EXISTING] Batch create
├── g1-data-grid.tsx                    # [EXISTING] Data table (shared)
└── g1-audit-timeline.tsx              # [KEPT] Audit timeline
```

## Component Usage Matrix (Shadcn)

| Component          | Wizard | Dashboard | AppQueue | AppDetail | Lists | Settings |
|--------------------|--------|-----------|----------|-----------|-------|----------|
| Card               | x      | x         |          | x         |       | x        |
| Badge              | x      | x         | x        | x         | x     |          |
| Avatar             | x      |           |          | x         |       |          |
| Button             | x      | x         | x        | x         | x     | x        |
| Dialog             | x      | x         | x        | x         |       |          |
| Sheet              |        |           |          |           |       |          |
| DataTable          |        |           | x        |           | x     |          |
| Input              | x      |           |          |           |       | x        |
| Select             | x      | x         | x        |           | x     | x        |
| Textarea           | x      |           |          |           |       |          |
| Calendar           | x      |           |          |           |       | x        |
| Popover            | x      |           |          |           |       |          |
| Progress           | x      | x         |          |           |       |          |
| Tooltip            | x      | x         | x        |           | x     |          |
| AlertDialog        |        |           |          | x         |       |          |
| Command            | x      |           |          |           |       |          |
| Checkbox           | x      |           |          |           |       |          |
| Collapsible        |        |           |          | x         |       |          |
| Skeleton           | x      | x         | x        | x         | x     |          |
| Field+FieldGroup   | x      |           |          |           |       |          |
| Separator          |        | x         |          | x         |       |          |

---