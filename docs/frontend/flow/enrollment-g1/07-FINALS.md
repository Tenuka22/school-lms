# Audit Trail & Appeal Panel

> **NOT YET IMPLEMENTED** — These pages and features are planned but not built.

## Planned Routes

- `/student-management/enrollment/g1/applications/$id/audit` — Audit trail
- `/student-management/enrollment/g1/applications/$id/appeal` — Appeal history

---

## Planned Audit Trail

### Entity Connection
`g1_applications` → `g1_audit` (one-to-many).

### Planned Fields
`table_name`, `record_id`, `action` (Insert/Update/Delete/Verify/Mark/AppealDecide), `old_values` JSON, `new_values` JSON, `performed_by`, `performed_at`, `ip_address`.

### Planned Features
- Vertical timeline with colored dots
- Action type filters
- Date range filters
- JSON diff viewer for Update actions

---

## Planned Appeal Panel

### Entity Connection
`g1_applications` → `appeal_history` (one-to-many).

### Planned Fields
`appeal_reference`, `appeal_type`, `reason_text`, `supporting_docs` JSON, `status`, `original_marks`, `revised_marks`, `decision_reason`.

### Planned Features
- Appeal timeline (Filed → UnderReview → ReEvaluated → Accepted/Rejected)
- New appeal form with 14-day deadline validation
- Officer review actions (accept/reject with revised marks)
