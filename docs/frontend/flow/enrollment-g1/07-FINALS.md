# Audit Trail

## Route
`/student-management/enrollment/g1/applications/$enrollment-id/audit`
> File: `apps/web/src/routes/_authenticated/student-management/enrollment/g1/applications.$enrollment-id.audit.tsx`

---

## Entity Connection
`g1_applications` → `g1_audit` (one-to-many).
Fields: table_name, record_id, action (Insert/Update/Delete/Verify/Mark/AppealDecide), old_values JSON, new_values JSON, performed_by, performed_at, ip_address.

---

## Timeline Layout

Vertical timeline with colored dot + connector line. Each entry: timestamp (monospace), Action Badge, Table Badge, description text, performer name + IP.

## Diff Viewer

Collapsible section for Update/Mark actions: shows field-by-field old→new value comparison in monospace table.

| Action | Icon | Dot Color | Badge |
|--------|------|-----------|-------|
| Insert | Plus | green | default |
| Update | Pencil | blue | secondary |
| Delete | Trash2 | red | destructive |
| Verify | CheckCircle | emerald | default |
| Mark | Hash | purple | outline |
| AppealDecide | Gavel | amber | outline |

## Filters
Action type, Table name, Date range (today/week/month/custom).

## Empty State
Icon + "No audit records found. Actions on this application will appear here."

---

# Appeal Panel

## Route
`/student-management/enrollment/g1/applications/$enrollment-id/appeal`
> File: `apps/web/src/routes/_authenticated/student-management/enrollment/g1/applications.$enrollment-id.appeal.tsx`

---

## Entity Connection
`g1_applications` → `appeal_history` (one-to-many).
Fields: appeal_reference, appeal_type (DistanceCalculation/DocumentRejection/CategoryEligibility/MarkingError/FraudAllegation/Other), reason_text, supporting_docs JSON, status (Filed→UnderReview→ReEvaluated→Accepted/Rejected), original_marks, revised_marks, decision_reason.

---

## Timeline Layout

Pending: "No appeals filed yet" with empty icon.
Active: vertical timeline — Filed (blue) → UnderReview (amber) → ReEvaluated (purple) → Accepted (green) / Rejected (red).
Each entry: status Badge + type Badge, reason text, decision inline, supporting docs link.

## New Appeal Form

Type Select, reason Textarea (≥50 chars), file drop zone. 14-day deadline validation from finalized_at. Submit → status = Appealed, creates audit.

## Officer Section

Only when UnderReview. Accept/Reject dropdown, RevisedMarks input, DecisionReason Textarea. Submit → creates audit.