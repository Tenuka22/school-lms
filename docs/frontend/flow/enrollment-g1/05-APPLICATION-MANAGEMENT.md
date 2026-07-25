# Application Management & Approval

> **NOT YET IMPLEMENTED** — This page and its features are planned but not built.

## Planned Route
`/student-management/enrollment/g1/applications`

---

## Planned Purpose

This will be the **approval queue** — where `PENDING_APPROVAL` applications are ranked descending by total_marks. Officers will be able to view, approve, and reject applications.

---

## Planned Approval Flow

```
APPROVED action triggers:

1. INSERT INTO students:
   - full_name = enrollment.child.full_name
   - date_of_birth = enrollment.child.date_of_birth
   - gender, religion, nationality from child
   - medium_of_instruction from enrollment
   - current_grade = 1
   - admission_date = now()
   - status = Active
   - admission_number = auto-generated

2. INSERT INTO student_join_guardians:
   - student_id → new student
   - guardian_id → enrollment's guardian(s)
   - relationship + is_primary from g1_join_guardians

3. INSERT INTO student_join_addresses:
   - student_id → new student
   - address_id → enrollment's address(es)
   - address_type + is_primary from g1_join_addresses

4. UPDATE enrollment:
   - status → APPROVED
   - finalized_at = now()

5. INSERT INTO g1_audit (action: "APPROVE")
```

---

## Planned Features

- Data table sorted by `total_marks DESC`
- School filter, category filter, marks range filter
- Quota progress bar per school
- Application detail page with tabs: Overview, Documents, Marks, Audit, Appeal
- Approve/Reject actions with confirmation dialogs
- Redirect to admission lists after approval
