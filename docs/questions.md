# G1 2026 Admission System - Questions & Inconsistencies

> This document identifies unclear, inconsistent, or fragmented areas in the design doc `g1_2026_admission_system_design.md` and the actual implementation. Use the G1 2026 circular PDF to resolve these.

---

## 1. Status Workflow Mismatch (Critical)

The design doc defines an **12-status workflow** (`Draft → Submitted → Docs_Pending → Under_Verification → Verified → Marked → Shortlisted → Appealed → Finalized → Admitted → Rejected → Withdrawn`), but the actual database enum (`EnrollmentStatus`) only has **8 values**: `Pending`, `Completed`, `PendingApproval`, `Approved`, `Admitted`, `Rejected`, `Withdrawn`, `Removed`.

| Design Doc Status | Implementation Status | Mapped? |
|---|---|---|
| `Draft` | — | No equivalent? |
| `Submitted` | — | Merged into `Pending`? |
| `Docs_Pending` | — | Not present |
| `Under_Verification` | — | Not present |
| `Verified` | — | Merged into `PendingApproval`? |
| `Marked` | — | Merged into `Completed`? |
| `Shortlisted` | — | Not present |
| `Appealed` | — | Merged into `PendingApproval`? |
| `Finalized` | — | Not present |
| `Admitted` | `Admitted` | Yes |
| `Rejected` | `Rejected` | Yes |
| `Withdrawn` | `Withdrawn` | Yes |

**Questions:**
1. What is the exact mapping between the 12-status circular workflow and the 8-status implementation?
2. What does `Completed` mean in the implementation? Is it equivalent to `Marked` or `Finalized` in the circular?
3. What does `PendingApproval` mean? Which circular workflow stage does it correspond to?
4. What does `Removed` mean? Is it a soft-delete or a separate status?
5. The design doc has no `Completed` status — what does this status represent in the circular?
6. The design doc has no `Draft` / `Docs_Pending` / `Under_Verification` / `Shortlisted` / `Finalized` statuses — are these intentionally omitted?

---

## 2. `wizard_step` Field (Not in Design Doc)

The design doc's `applications` table schema has **no `wizard_step` column**. But the implementation added `wizard_step: Option<i16>` to track wizard progress (1-6).

**Questions:**
7. What is the purpose of `wizard_step`? Is it a transient UI state or a persistent business field?
8. Should it be in the design doc's `applications` table?
9. Is this G1-specific, or does it apply to all admission grades?

---

## 3. Missing Tables / Entities

The design doc references tables not present in the implementation, and vice versa.

### Missing from Implementation
| Design Doc Table | Implementation Equivalent? | Notes |
|---|---|---|
| `children` | — | Child data is embedded in `applications` (denormalized) |
| `guardians` | — | Guardian data is embedded in `applications` (denormalized) |
| `districts` | — | Referenced in `schools.district_id` FK |
| `audit_logs` | — | Exists as `db::entity::g1::audit` but different schema |
| `enrollment_batches` | Exists — `enrollment_batches` | Present |
| `applications.status` uses ENUM | Uses `EnrollmentStatus` Rust enum | Mismatch with design doc 12 values |

**Questions:**
10. Is `children` a separate entity or embedded in `applications`? The ERD shows it as a separate table with `PK child_id`, but `applications` has `child_id UUID FK → children` — is this FK enforced?
11. Is `guardians` a separate entity or embedded? The ERD shows it as separate with `PK guardian_id`, but `applications` has `guardian_id UUID FK → guardians`.
12. Where is the `districts` table? Referenced in `schools.district_id FK → districts` but not defined anywhere.
13. The `audit_logs` table in the design doc has `action` ENUM('INSERT', 'UPDATE', 'DELETE', 'VERIFY', 'MARK', 'APPEAL_DECIDE') — does the implementation's audit table match this schema?

---

## 4. Field Name Mismatches

| Design Doc Field | Implementation Field | Notes |
|---|---|---|
| `application_id` | `id` | Design doc uses `application_id` PK |
| `reference_no` | `reference_no` | — |
| `applied_year` | `applied_year` | Design doc says DEFAULT 2027, implementation uses `batch.year` |
| `school_id` | `school_id` | — |
| `child_id` | `student_id` | Design doc: `child_id FK → children`, Implementation: `student_id Option<UUID>` |
| `guardian_id` | — | Not present in implementation `applications` table |
| `status` | `enrollment_status` | Design doc uses `status`, impl uses `enrollment_status` |
| `total_marks` | `total_marks` | — |
| `rank` | `rank_number` | Design doc says `rank`, impl says `rank_number` |
| `list_category` | `category` | Design doc says `list_category ENUM('Main','Waiting','Not_Selected')`, impl says `category Option<G1Category>` |
| `submitted_at` | `submitted_at` | — |
| `verified_at` | `verified_at` | — |
| `verified_by` | `verified_by` | — |
| `finalized_at` | `finalized_at` | — |
| `ip_address` | `ip_address` | — |
| `user_agent` | `user_agent` | — |
| `birth_reg_number` | `birth_certificate_number` | Different names |

**Questions:**
14. Is `child_id` renamed to `student_id`? If so, is the FK to a `children` table or `students` table?
15. Where is `guardian_id` in the implementation? The design doc has `guardian_id UUID FK → guardians` in `applications`, but it's not in the Rust model.
16. What is `G1Category` vs `list_category`? The design doc says `list_category ENUM('Main', 'Waiting', 'Not_Selected')` but the implementation uses `G1Category` — what are its values?
17. The design doc says `applied_year DEFAULT 2027` but the design doc says "For 2027 academic year" — is this hardcoded or derived from the batch?

---

## 5. Inconsistent Status Transitions

The design doc describes a linear workflow: `Draft → Submitted → ... → Admitted/Rejected`. But the implementation has:
- `Pending → Completed` (via wizard completion or submit)
- `Completed → PendingApproval` (via marking)
- `PendingApproval → Approved` (via list generation)
- `Approved → Admitted` (final confirmation)

**Questions:**
18. Can an application go backwards in the workflow? E.g., from `Admitted` back to `PendingApproval` if an appeal changes marks?
19. What triggers the transition from `Completed` to `PendingApproval`? Is it the marking engine?
20. What triggers `Approved` → `Admitted`? Is it manual or automatic?
21. Can a `Rejected` application be re-submitted? The design doc mentions a "7-day window to re-submit corrected documents" — how is this enforced in the implementation?

---

## 6. Batch / Enrollment Cycle

The design doc mentions "applied_year" and batch-based processing. The `enrollment_batches` table exists but its relationship to the `applications` table is via `batch_id`.

**Questions:**
22. What is the lifecycle of an `enrollment_batch`? Are batches created for each admission year?
23. Can a batch be re-opened after being closed? The design doc says "batch must be closed before generating lists" — what happens after lists are generated?
24. Is `applied_year` derived from the batch's year, or is it set independently?
25. The design doc says `applied_year YEAR NOT NULL DEFAULT 2027` — is this always 2027 or does it vary?

---

## 7. Scoring & Marking Logic

The design doc has detailed marking phases but some logic is unclear.

**Questions:**
26. **Phase 1 Category Eligibility**: What happens if a guardian qualifies for multiple categories (e.g., both Staff AND Sibling)? Are weights additive or exclusive?
27. **Maximum possible marks**: 50 (Proximity) + 25 (Staff) + 14 (Sibling) + 6 (Alumni) + 4 (Govt) + 1 (Special) = 100. Is this always the total, or can it vary?
28. The design doc says `total_marks DECIMAL(5,2) DEFAULT 0.00` — but if no categories apply, should total be 0 or NULL?
29. **Distance calculation**: The design doc says to use Google Maps API for geocoding — is this implemented? What happens if the API is unavailable?
30. **Walking distance vs straight-line**: The design doc mentions "walking distance via road network preferred over straight-line if data available" — is road network data available? Is there a default fallback?
31. **GN Division Boundary**: "If address is on boundary of GN division, use school-side measurement" — how is a boundary address detected?
32. **Staff distance penalty**: If a staff member lives >100km from the school, they need "boarding proof" — what constitutes boarding proof? Is this a document type?
33. **Sibling distance scoring**: Siblings use the same distance bands as proximity but are calculated separately. Is the sibling's address the same as the application address, or a separate address?
34. **Past Pupil scoring**: "Highest grade completed matters" — where is `highest_grade` determined? From the `past_pupil_details` table or from school records?
35. **Government service years tiers**: The design doc uses thresholds of 20, 15, 10, 5 years. Are these from the circular or configurable?

---

## 8. Quota & List Generation

**Questions:**
36. **Reserved quotas**: "Minimum 5 seats reserved for staff children (if applied). If reserved quota applicants < reserved seats, redistribute to general proximity." — does "general proximity" mean all remaining proximity-weighted applicants, or only non-staff applicants?
37. **Special needs quota**: "1% or minimum 1 seat for special needs (if building accessible)" — how is "building accessible" determined? Is this a school-level flag?
38. The design doc says `waiting_list = applications[quota:quota+20]` — the "+20" for waiting list size. Is 20 always the waiting list size or is it configurable?
39. **Tie-breaking**: The design doc lists 4 tie-breakers (marks → proximity → timestamp → lottery). The implementation uses `ORDER BY total_marks DESC, submitted_at ASC` — is proximity used as a tie-breaker? Is lottery truly random or deterministic?
40. **Appeals impact on list**: If an appeal increases marks and bumps another applicant from main list to waiting, what happens to the person who was bumped? Do they get notified?

---

## 9. Appeals Workflow

**Questions:**
41. **Filing window**: "Appeals must be filed within 14 days of list publication" — how is the list publication date tracked and communicated?
42. The `appeals` table has `appeal_type` ENUM('Distance_Calculation', 'Document_Rejection', 'Category_Eligibility', 'Marking_Error', 'Fraud_Allegation', 'Other') — but the design doc Section 9.1.1-9.1.4 only describes 4 types. What about the other 2?
43. What happens to `marks_breakdown` when an appeal results in re-evaluation? Are old marks preserved in the audit log?
44. The design doc mentions "blacklist guardian for 3 years" if fraud confirmed — how is this enforced in the system? Is there a blacklist table?
45. The design doc mentions "if accusation is malicious, accuser blacklisted" — how is "malicious" determined? By whom?

---

## 10. Document Verification

**Questions:**
46. **Auto OCR**: The design doc mentions "Auto OCR Check" in the verification workflow — is OCR actually implemented, or is it just auto-validation (format checks)?
47. **Birth Registry API**: "Validate registration number format against Birth Registry API" — is this API available and integrated?
48. **NIC check digit**: The design doc says "Check digit validation for Sri Lankan NIC format" — is the algorithm implemented?
49. **GN division database**: "Residence proof must be checked against GN division database" — what is this database? Is it an external API or a local lookup table?
50. **Staff cross-reference**: "Staff letters must be cross-referenced with `staff_details` table" — but this table is about current school staff, not all government servants. Is there a separate government employee database?

---

## 11. Fraud Detection

**Questions:**
51. **"Same address used for >3 applications"**: What counts as "same address"? Exact match of `address_line_1` or a radius-based proximity check?
52. **"Image hash comparison to detect reused documents"**: What hash algorithm? SHA-256 is stored in `documents.file_hash` but is it used for duplicate detection?
53. **"Distance anomaly: If calculated distance differs >20% from declared distance"**: What distance is "declared"? Is there a user-declared distance field?
54. **"Staff employment verified as false with payroll database"**: Is there a payroll database integration? Or is this manual?
55. **Blacklisting**: When a guardian is blacklisted, what happens to their existing applications? Are they all rejected?

---

## 12. Audit & Transparency

**Questions:**
56. The design doc `audit_logs` table has `action` ENUM('INSERT', 'UPDATE', 'DELETE', 'VERIFY', 'MARK', 'APPEAL_DECIDE') — the implementation's audit log (`db::entity::g1::audit`) has `AuditOperation` enum — what are its variants? Do they match?
57. The design doc says "Mark Recalculation Log: Any manual mark changes must be logged with reason" — is there a `reason` field in the implementation's audit log? The implementation has `context` field but it's `Option<String>` — is reason stored there?
58. **"List Modification Log: Any post-publication changes with judicial approval"**: How is judicial approval tracked? Is there an approval workflow?
59. **Notification system**: The design doc mentions "SMS + Email + Portal update" for appeal decisions and admission. Is there a notification service implemented?

---

## 13. Data Retention & Privacy

**Questions:**
60. The design doc says "Personal identifiers hashed after 7 years for statistical use" — is this implemented? What hashing algorithm?
61. "Archive to read-only after 1 year" — is there a mechanism to archive records?
62. "Retain for 7 years for audit/compliance (Section 10.2)" — Section 10.2 of the circular — what does it specifically say about retention?
63. What happens to `file_url` in `documents` table when records are archived? Are the files retained?

---

## 14. User Roles & Permissions

**Questions:**
64. The design doc has 6 user roles (`System_Admin`, `Zonal_Officer`, `School_Principal`, `Verification_Officer`, `Appeals_Officer`, `Parent`). The implementation uses RBAC with `Permission::G1ApplicationUpdate`, `Permission::G1ApplicationDelete`, etc. — how do these map to the 6 roles?
65. **Parent role**: "Limited view" — what can a parent see? Can they only see their own application?
66. The `users` table has `school_id UUID FK → schools` with `NULL for zonal/admin` — how are zonal officers assigned to schools or zones?

---

## 15. Implementation Gaps (Features in Doc but Not in Code)

| Design Doc Feature | Implemented? | Notes |
|---|---|---|
| `children` as separate table | No | Embedded in `applications` |
| `guardians` as separate table | No | Embedded / joined |
| Auto OCR for document validation | Unclear | |
| Birth Registry API integration | Unclear | |
| NIC check digit validation | Unclear | |
| Google Maps API for geocoding | Unclear | |
| Road network distance (vs straight-line) | Unclear | |
| GN division database lookup | Unclear | |
| Fraud detection engine (pattern analysis, image hash) | Unclear | |
| Blacklist table | No | |
| Notification service (SMS/Email) | Unclear | |
| Judicial approval workflow for list changes | No | |
| PDF admission letter generation | No | |
| Public dashboard queries | Unclear | |
| Data archival / read-only after 1 year | No | |
| Personal identifier hashing after 7 years | No | |
| Lottery tie-breaker | Unclear | |

---

## 16. Relationship Between Design Doc and Circular PDF

The design doc is described as "Based on Current Admission Circular" but:
67. Which specific circular is this based on? Is it the "G1 2026" circular (the `g1 2026 circular.pdf` in the docs folder)?
68. Are there sections of the circular that are not covered in the design doc?
69. Are the section references in the design doc (e.g., "Section 4.1", "Section 7.2") referring to the same circular PDF?

---

## 17. Additional Inconsistencies

70. The design doc ERD shows `APPLICATION_HISTORY` but this table doesn't appear in the design doc's schema section — only referenced in the ERD. No corresponding implementation exists.
71. The design doc says `applications.status` has a DEFAULT of `'Draft'`, but the implementation's `EnrollmentStatus` enum defaults to `Pending`. What does "Draft" mean in the circular vs "Pending"?
72. The design doc has `list_category` ENUM('Main', 'Waiting', 'Not_Selected') but the implementation has `category Option<G1Category>` — these are different fields with different purposes.
73. The design doc has `school_id` as nullable in the ERD but the implementation has `school_id: Option<Uuid>` with a default of `SEEDED_SCHOOL_ID` — is the seed school a special case?
74. The design doc's `applications` table has no `reference_no` UNIQUE constraint mentioned in the code — the code generates `reference_no` with format `"TMP-{uuid}"` for temporary, but the design doc says system-generated format `"G1-2026-123456"`. Which format is actually used?
75. The design doc has `student_id UUID FK → children` in `applications`, but the implementation has no `children` table — it directly stores child data in `applications` (denormalized). Does this mean the FK is always NULL?
