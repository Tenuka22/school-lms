# G1 Admission — Imperative Pipeline Architecture

## Architectural Principle

This system uses an **imperative, flow-based pipeline** — not a free-form declarative CRUD model. Users cannot freely change enrollment status or delete records at will. Instead, the system enforces a **locked-step state machine** that guarantees data integrity and prevents impossible states.

---

## The Pipeline (State Machine)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
│ PENDING  │ →  │COMPLETED │ →  │ PENDING  │ →  │   APPROVED   │ →  │ ADMITTED │
│          │    │ (info    │    │ APPROVAL │    │ (→ creates   │    │          │
│ (data    │    │  filled) │    │          │    │  student)    │    │          │
│  entry)  │    └──────────┘    └──────────┘    └──────────────┘    └──────────┘
└──────────┘                                                              ↑
     │                                                                     │
     └──────────► REJECTED (end state)                                     │
                                                                           │
     ┌──────────┐                                                          │
     │ WITHDRAWN│ ← (manual withdrawal, end state)                         │
     └──────────┘                                                          │
```

### Enforced State Transitions

| From            | To              | Trigger                                    | Guard Conditions                                   |
|-----------------|-----------------|--------------------------------------------|----------------------------------------------------|
| **PENDING**     | **COMPLETED**   | All required data entered via wizard        | Child+Guardian+School+Address+Siblings+Documents   |
| **PENDING**     | **REJECTED**    | Officer rejects                             | Officer role, reason required                      |
| **PENDING**     | **WITHDRAWN**   | Parent/System withdraws                     | —                                                  |
| **COMPLETED**   | **PENDING_APPROVAL** | Marks calculated, ranked in descending order | All marks computed, ranked within school          |
| **COMPLETED**   | **WITHDRAWN**   | Parent withdraws                            | —                                                  |
| **PENDING_APPROVAL** | **APPROVED** | Officer approves → creates student record   | Student table has capacity, duplicate check passed |
| **PENDING_APPROVAL** | **REJECTED** | Officer rejects                             | Reason required                                    |
| **APPROVED**    | **ADMITTED**    | Student formally admitted                   | Admission lists finalized                          |

**Illegal transitions** (prevented by backend + frontend guards):
- Draft → Submitted (no free-form editing)
- Verified → Pending (no going backwards)
- Any status → Deleted (soft-delete only via WITHDRAWN)
- APPROVED → REJECTED (student already created)

---

## Imperative Enforcement in UI

| User Action                 | UI Behavior                                    |
|-----------------------------|-------------------------------------------------|
| Create enrollment           | `G1EnrollmentDialog` → auto-sets status=`PENDING`, redirects to wizard |
| Edit after COMPLETED        | Wizard opens in **read-only review mode**, no editing allowed |
| Change marks                | Only via **Marks Calculator** (admin-only, audit-logged) |
| Delete enrollment           | Only available in PENDING state, sets to WITHDRAWN, not hard-delete |
| Approve                     | Separate "Approval Queue" page, not a dialog on the data grid |

---

## Why Imperative Over Declarative

| Problem (Declarative)               | Solution (Imperative)                              |
|-------------------------------------|-----------------------------------------------------|
| User changes status mid-wizard      | Wizard locks after COMPLETED; no manual status dropdown |
| User deletes after approval         | APPROVED records are locked; only WITHDRAWN allowed |
| User forgets required fields        | Each pipeline step validates before allowing progression |
| User changes school after marks     | School is locked after COMPLETED                    |
| Out-of-order data entry             | Wizard enforces sequential steps                    |
| Missing documents at approval       | COMPLETED state requires all required docs          |

---

## Statuses (Simplified)

Only these statuses exist in the UI for the enrollment pipeline:

| Status             | Description                                       |
|--------------------|---------------------------------------------------|
| **PENDING**        | Created, wizard begun but not complete             |
| **COMPLETED**      | All info entered, ready for marks calculation      |
| **PENDING_APPROVAL** | Marks ranked, awaiting officer approval            |
| **APPROVED**       | Student record created, enrollment finalized       |
| **ADMITTED**       | Student formally admitted to school                |
| **REJECTED**       | Terminal: application rejected                     |
| **WITHDRAWN**      | Terminal: parent/system withdrew                   |

No `Draft`, no `Under_Verification`, no `Shortlisted` — these are sub-states handled within the pipeline internally, not exposed as user-facing statuses.

---

## Application Management Route (New)

`/student-management/enrollment/g1/applications` — where scored & ranked applications live, sorted **descending by total_marks** by default. This is the approval queue for officers.

Only applications in `PENDING_APPROVAL` appear here. Officers can:
- View full application detail (read-only)
- **Approve** → creates `student` record + connects `student_join_addresses`, `student_join_guardians`
- **Reject** → sets to REJECTED with reason
- See rank order (marks descending, tied by proximity → timestamp → lottery)

---