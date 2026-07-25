# Grade 1 School Admission System — Unified Design Document
## Based on Circular No. 25/2026 (2027 Academic Year)

**Version:** 2.0  
**Date:** 2026-07-25  
**Authority:** Ministry of Education, Sri Lanka — Grade 1 Admission Circular 25/2026  
**Scope:** Resolves all identified inconsistencies between the previous design document, current implementation, and the official circular.

---

## 1. Circular Reference & Compliance

| Item | Value |
|---|---|
| Circular Number | 25/2026 |
| Academic Year | 2027 |
| Issuing Authority | Ministry of Education, Sri Lanka |
| Application Period | As announced by the Ministry (typically June–July prior to admission year) |
| Legal Retention | 7 years per Section 10.2 of the circular |

All section references in this document (e.g., "Section 7.2.1") refer to the corresponding sections of **Circular 25/2026**.

---

## 2. Status Workflow (Resolved)

The circular does not prescribe a 12-step database status enum. It describes a **business process** (draft → submit → verify → mark → list → appeal → finalize → admit). The implementation uses a pragmatic 8-value `EnrollmentStatus` enum. The following mapping reconciles both.

### 2.1 Canonical Status Enum (`enrollment_status`)

```sql
ENUM(
  'Draft',           -- Parent is filling the wizard
  'Pending',         -- Submitted, awaiting document verification (maps circular 'Submitted/Docs_Pending/Under_Verification')
  'Completed',       -- All docs verified, ready for marking (maps circular 'Verified')
  'PendingApproval', -- Marks calculated, awaiting list generation (maps circular 'Marked/Shortlisted')
  'Approved',        -- Placed on Main or Waiting list, awaiting final confirmation (maps circular 'Finalized')
  'Admitted',        -- Final admission confirmed
  'Rejected',        -- Not selected or fraud confirmed
  'Withdrawn'        -- Parent withdrew application
)
```

### 2.2 Design Doc → Implementation Mapping

| Circular Business Stage | Design Doc Status | Implementation Status | Notes |
|---|---|---|---|
| Parent filling form | `Draft` | `Draft` | Exact match |
| Submitted, docs pending | `Submitted`, `Docs_Pending` | `Pending` | Merged into `Pending` |
| Under verification | `Under_Verification` | `Pending` | Officer review happens while `Pending` |
| Verified complete | `Verified` | `Completed` | `Completed` = docs verified, ready to mark |
| Marks calculated | `Marked` | `PendingApproval` | `PendingApproval` = scored, awaiting list generation |
| Shortlisted | `Shortlisted` | `PendingApproval` | Same stage |
| Appeals filed | `Appealed` | `PendingApproval` | Appeal does not change status; tracked in `appeals` table |
| Finalized | `Finalized` | `Approved` | `Approved` = on a list (Main/Waiting) |
| Admitted | `Admitted` | `Admitted` | Exact match |
| Rejected | `Rejected` | `Rejected` | Exact match |
| Withdrawn | `Withdrawn` | `Withdrawn` | Exact match |

**Resolution to Questions 1–6, 18–21, 71:**
- `Completed` in the implementation = `Verified` in the circular workflow (documents verified, ready for marking).
- `PendingApproval` in the implementation = `Marked`/`Shortlisted`/`Appealed` in the circular workflow (awaiting final list generation).
- `Approved` in the implementation = `Finalized` in the circular workflow (placed on a list).
- `Removed` in the implementation enum is **deprecated**; use `Rejected` or `Withdrawn` instead. If it exists in legacy code, map it to `Rejected` with a soft-delete flag.
- Backward transitions: Appeals may increase marks and change list position, but status remains `PendingApproval` until lists are regenerated. `Admitted` → `PendingApproval` is **not** allowed; instead, an appeal triggers a re-evaluation job that updates marks and list position atomically.
- `Rejected` applications can be re-submitted within the 7-day correction window (Section 5.2) by creating a new revision or updating status back to `Draft` with corrected documents.

### 2.3 `wizard_step` Field

- **Purpose:** Tracks transient UI progress (Steps 1–6) during data entry. Not a business status.
- **Persistence:** Stored in `applications.wizard_step: SMALLINT` for UX convenience only.
- **Scope:** G1-specific; other grades may use a different wizard or none.
- **Validation:** Must be NULL for any non-`Draft` status.

---

## 3. Entity Relationship Diagram (Logical)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    SCHOOL       │     │   APPLICATION    │     │    CHILD        │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ PK school_id    │◄────┤ PK application_id│◄────┤ PK child_id     │
│    name_si      │     │    reference_no  │     │    full_name    │
│    name_en      │     │    batch_id FK   │     │    dob          │
│    address      │     │    status        │     │    gender       │
│    type         │     │    total_marks   │     │    birth_reg_no │
│    category     │     │    rank_number   │     │    nic          │
│    quota_limit  │     │    category      │     │    photo_url    │
│    geo_location │     │    submitted_at  │     │    disability   │
└─────────────────┘     │    verified_at   │     └─────────────────┘
                        │    finalized_at  │              │
                        │    school_id FK  │            │
                        │    child_id FK   │            │
                        │    guardian_id FK│◄───────────┘
                        └──────────────────┘            │
                                   │                    │
                        ┌──────────┘                    │
                        ▼                               ▼
               ┌─────────────────┐              ┌─────────────────┐
│  APPLICATION_HISTORY      │              │    GUARDIAN     │
│  (Audit/Status Log)       │              ├─────────────────┤
├─────────────────┤              │ PK guardian_id  │
│ PK history_id   │              │    relationship │
│    status_from  │              │    full_name      │
│    status_to    │              │    nic_number     │
│    actor_id     │              │    is_govt_emp    │
│    reason       │              │    is_school_staff│
│    timestamp    │              │    is_past_pupil  │
└─────────────────┘              └─────────────────┘
                                          │
                        ┌─────────────────┘
                        ▼
               ┌─────────────────┐
│    ADDRESS      │
├─────────────────┤
│ PK address_id   │
│    app_id FK    │
│    line_1..3    │
│    city         │
│    district     │
│    gs_division  │
│    latitude     │
│    longitude    │
│    distance_km  │
│    residence_type│
└─────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    SIBLING      │     │    DOCUMENT      │     │  MARKS_BREAKDOWN│
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ PK sibling_id   │     │ PK document_id   │     │ PK mark_id      │
│    app_id FK    │     │    app_id FK     │     │    app_id FK    │
│    full_name    │     │    doc_type      │     │    category     │
│    school_id FK │     │    file_url      │     │    raw_marks    │
│    current_grade│     │    file_hash     │     │    max_raw      │
│    verified     │     │    status        │     │    weight_pct   │
└─────────────────┘     │    verified_by   │     │    weighted_score│
                        │    verified_at   │     │    distance_km  │
                        │    fraud_flag    │     │    distance_band│
                        └──────────────────┘     │    calculated_at│
                                                 └─────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    APPEAL       │     │  ADMISSION_LIST  │     │     USER        │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ PK appeal_id    │     │ PK list_id       │     │ PK user_id      │
│    app_id FK    │     │    app_id FK     │     │    username     │
│    appeal_type  │     │    school_id FK  │     │    role         │
│    reason       │     │    list_type     │     │    school_id FK │
│    status       │     │    position      │     │    is_active    │
│    filed_at     │     │    quota_category│     └─────────────────┘
│    reviewed_by  │     │    admitted      │
│    reviewed_at  │     │    admitted_at   │
│    original_marks│    │    promoted_at   │
│    revised_marks│     └──────────────────┘
│    decision     │
└─────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  STAFF_DETAIL   │     │  PAST_PUPIL      │     │  ENROLLMENT_BATCH│
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ PK staff_id     │     │ PK alumni_id     │     │ PK batch_id     │
│    guardian_id FK│    │    guardian_id FK│     │    year         │
│    school_id FK │     │    school_id FK  │     │    status       │
│    designation  │     │    highest_grade │     │    opened_at    │
│    employment_type│   │    year_left     │     │    closed_at    │
│    service_start│     │    verified      │     │    list_published_at│
│    is_current   │     └──────────────────┘     └─────────────────┘
│    distance_km  │
└─────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AUDIT_LOG      │     │  BLACKLIST       │     │  NOTIFICATION   │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ PK log_id       │     │ PK blacklist_id  │     │ PK notif_id     │
│    table_name   │     │    guardian_id FK│     │    user_id FK   │
│    record_id    │     │    reason        │     │    channel      │
│    action       │     │    blacklisted_at│     │    subject      │
│    old_values   │     │    expires_at    │     │    body         │
│    new_values   │     │    evidence_url  │     │    sent_at      │
│    performed_by │     └──────────────────┘     │    status       │
│    performed_at │                              └─────────────────┘
│    ip_address   │
│    reason       │
└─────────────────┘
```

---

## 4. Database Schema (Physical)

### 4.1 Core Tables

#### `enrollment_batches`
```sql
batch_id           UUID PRIMARY KEY
year               INT NOT NULL           -- e.g., 2027
status             ENUM('Open', 'Closed', 'Lists_Published', 'Appeals_Period', 'Finalized')
opened_at          TIMESTAMP
closed_at          TIMESTAMP              -- Section 5.1: Application window closes
list_published_at  TIMESTAMP              -- Section 8: When main/waiting lists are published
appeal_deadline_at TIMESTAMP              -- Section 9.2: 14 days after list publication
finalized_at       TIMESTAMP
```
**Resolution Q22–25:** Batches are created per admission year. `applied_year` is **derived** from `batch.year`, not stored independently. The design doc's `DEFAULT 2027` was a placeholder; the system uses the active batch's year.

#### `schools`
```sql
school_id          UUID PRIMARY KEY
school_name_si     VARCHAR(255) NOT NULL
school_name_en     VARCHAR(255)
school_type        ENUM('1AB', '1C', 'Type-2', 'Type-3')
address            TEXT
district_id        UUID                   -- FK to districts table (to be populated)
category           ENUM('Urban', 'Rural', 'Difficult', 'Estate')
grade_1_quota      INT NOT NULL DEFAULT 35 -- Section 4.1: Minimum 35, up to 40
building_accessible BOOLEAN DEFAULT TRUE   -- Section 7.7: For special needs quota
geo_location       POINT                  -- (lat, long)
status             ENUM('Active', 'Inactive')
created_at         TIMESTAMP
```

#### `children`
```sql
child_id           UUID PRIMARY KEY
full_name          VARCHAR(255) NOT NULL
date_of_birth      DATE NOT NULL          -- Section 4.1: Must be 5 years by Jan 31
birth_reg_number   VARCHAR(50) UNIQUE
gender             ENUM('Male', 'Female')
photo_url          VARCHAR(500)
religion           VARCHAR(50)            -- Section 6.2.5
nationality        VARCHAR(50) DEFAULT 'Sri Lankan'
disability_status  BOOLEAN DEFAULT FALSE  -- Section 7.7
disability_type    VARCHAR(100)
created_at         TIMESTAMP
```
**Resolution Q10:** `children` is a **separate entity**. The implementation must enforce `child_id` FK in `applications`.

#### `guardians`
```sql
guardian_id        UUID PRIMARY KEY
relationship_type  ENUM('Mother', 'Father', 'Both', 'Legal_Guardian', 'Relative')
full_name          VARCHAR(255) NOT NULL
nic_number         VARCHAR(12) UNIQUE
contact_phone      VARCHAR(15)
contact_email      VARCHAR(255)
occupation         VARCHAR(100)
workplace_name     VARCHAR(255)
workplace_address  TEXT
is_govt_employee   BOOLEAN DEFAULT FALSE  -- Section 7.6
govt_service_years INT                    -- For marking calculation
is_school_staff    BOOLEAN DEFAULT FALSE  -- Section 7.3
is_past_pupil      BOOLEAN DEFAULT FALSE  -- Section 7.5
past_pupil_verified BOOLEAN DEFAULT FALSE
income_level       DECIMAL(12,2)
address_id         UUID                   -- FK to addresses (guardian's primary address)
```
**Resolution Q11:** `guardians` is a **separate entity**. `applications.guardian_id` FK must be enforced.

#### `applications` (Central Entity)
```sql
application_id     UUID PRIMARY KEY
reference_no       VARCHAR(20) UNIQUE NOT NULL  -- Format: G1-{YYYY}-{SEQUENCE} e.g., G1-2027-000001
batch_id           UUID NOT NULL FK → enrollment_batches
school_id          UUID NOT NULL FK → schools
child_id           UUID NOT NULL FK → children      -- Q14: Renamed from student_id; FK to children
guardian_id        UUID NOT NULL FK → guardians     -- Q15: Restored field

-- Status
enrollment_status  ENUM('Draft','Pending','Completed','PendingApproval','Approved','Admitted','Rejected','Withdrawn') DEFAULT 'Draft'
wizard_step        SMALLINT               -- Q7-9: Transient UI state (1-6), NULL when not Draft

-- Scoring (Section 7)
total_marks        DECIMAL(5,2) DEFAULT 0.00
rank_number        INT                    -- Q16: Renamed from rank; within school
list_category      ENUM('Main_List', 'Waiting_List', 'Not_Selected') NULL  -- Q16: G1Category renamed to list_category

-- Metadata
submitted_at       TIMESTAMP
verified_at        TIMESTAMP
verified_by        UUID FK → users
finalized_at       TIMESTAMP
ip_address         VARCHAR(45)
user_agent         TEXT

-- Constraints
CONSTRAINT uq_app_child_school_year UNIQUE (child_id, school_id, batch_id)
```
**Resolution Q14–17, 72–75:**
- `child_id` is the canonical name; `student_id` in implementation must be migrated to `child_id`.
- `guardian_id` is restored to `applications`.
- `list_category` uses the exact enum from the design doc; implementation's `G1Category` must be aligned.
- `reference_no` format is `G1-YYYY-######`, not `TMP-{uuid}`. Temporary drafts may use `TMP-{uuid}` internally but must be replaced on submission.
- `school_id` is NOT NULL; a default seed school is only for system initialization/testing.

### 4.2 Supporting Tables

#### `addresses`
```sql
address_id         UUID PRIMARY KEY
application_id     UUID FK → applications  -- Each app has one primary residence address
address_line_1     VARCHAR(255) NOT NULL
address_line_2     VARCHAR(255)
city               VARCHAR(100)
district           VARCHAR(100)
province           VARCHAR(100)
gs_division        VARCHAR(100)           -- Grama Niladhari Division
postal_code        VARCHAR(10)

-- Geospatial (Section 7.1.5)
latitude           DECIMAL(10,8)
longitude          DECIMAL(11,8)
distance_to_school_km DECIMAL(8,3)       -- Auto-calculated via Haversine / road network
verified_by_map    BOOLEAN DEFAULT FALSE

-- Residence proof (Section 6.2.1)
residence_type     ENUM('Owned', 'Rented', 'Relative', 'Other')
ownership_proof    VARCHAR(50)            -- Deed, Lease, GN Certificate
```

#### `siblings` (Section 7.4 — 14%)
```sql
sibling_id         UUID PRIMARY KEY
application_id     UUID NOT NULL FK → applications
sibling_name       VARCHAR(255)
school_id          UUID NOT NULL FK → schools  -- Must be same applied school
current_grade      INT
admission_year     YEAR
verified           BOOLEAN DEFAULT FALSE
verification_doc   VARCHAR(500)
```

#### `staff_details` (Section 7.3 — 25%)
```sql
staff_id           UUID PRIMARY KEY
guardian_id        UUID NOT NULL FK → guardians
school_id          UUID NOT NULL FK → schools
designation        VARCHAR(100)
employment_type    ENUM('Permanent', 'Temporary', 'Contract')
service_start_date DATE
service_end_date   DATE
is_current         BOOLEAN DEFAULT TRUE
verification_doc   VARCHAR(500)
distance_from_residence_km DECIMAL(5,2)   -- Section 7.3.1: >100km needs boarding proof
boarding_proof_doc VARCHAR(500)          -- Document for boarding proof if >100km
```

#### `past_pupil_details` (Section 7.5 — 6%)
```sql
alumni_id          UUID PRIMARY KEY
guardian_id        UUID NOT NULL FK → guardians
school_id          UUID NOT NULL FK → schools
highest_grade      VARCHAR(20)            -- GCE AL, GCE OL, Grade 11, etc.
year_left          YEAR
left_reason        ENUM('Completed', 'Transferred', 'Other')
verified           BOOLEAN DEFAULT FALSE
verification_method ENUM('School_Record', 'Exam_Certificate', 'Affidavit')
```

#### `documents` (Section 6)
```sql
document_id        UUID PRIMARY KEY
application_id     UUID NOT NULL FK → applications
document_type      ENUM(
                      'Birth_Certificate',
                      'Guardian_NIC',
                      'Residence_Proof',
                      'Sibling_School_Certificate',
                      'Staff_Appointment_Letter',
                      'Staff_Service_Certificate',
                      'Past_Pupil_Certificate',
                      'Past_Pupil_Exam_Cert',
                      'Govt_Service_Certificate',
                      'Disability_Certificate',
                      'Income_Certificate',
                      'Baptism_Certificate',
                      'Boarding_Proof',      -- Section 7.3.1
                      'Utility_Bills',       -- For rented residence <0.5km
                      'Other'
                   )
file_url           VARCHAR(500)
file_hash          VARCHAR(64)            -- SHA-256 for integrity & duplicate detection
uploaded_at        TIMESTAMP

-- Verification workflow
verification_status ENUM('Pending', 'Verified', 'Rejected', 'Flagged') DEFAULT 'Pending'
verified_by        UUID FK → users
verified_at        TIMESTAMP
rejection_reason   TEXT
fraud_flag         BOOLEAN DEFAULT FALSE
ocr_extracted_text TEXT                   -- Q46: Auto OCR result storage
```

#### `marks_breakdown` (Section 7 — Detailed Scoring)
```sql
mark_id            UUID PRIMARY KEY
application_id     UUID NOT NULL FK → applications
category_code      VARCHAR(10)            -- PROX, STAFF, SIBLING, ALUMNI, GOVT, SPECIAL

raw_marks          DECIMAL(5,2)           -- Score out of 100 for this category
max_raw_marks      DECIMAL(5,2) DEFAULT 100
weight_percentage  DECIMAL(4,2)           -- 50.00, 25.00, 14.00, 6.00, 4.00, 1.00
weighted_score     DECIMAL(5,2)           -- (raw/max) * weight

-- Distance-specific (for PROX, SIBLING)
distance_km        DECIMAL(6,3)
distance_band      ENUM('<0.5', '0.5-1', '1-2', '2-3', '3-5', '>5')

-- Calculation metadata
calculated_at      TIMESTAMP
calculation_rule   VARCHAR(100)           -- Which circular clause applied
```

#### `appeals` (Section 9)
```sql
appeal_id          UUID PRIMARY KEY
application_id     UUID NOT NULL FK → applications
appeal_reference   VARCHAR(20) UNIQUE

appeal_type        ENUM(
                      'Distance_Calculation',    -- Section 9.1.1
                      'Document_Rejection',    -- Section 9.1.2
                      'Category_Eligibility',  -- Section 9.1.3
                      'Marking_Error',         -- Section 9.1.4
                      'Fraud_Allegation',      -- Section 11: Fraud reports
                      'Other'                  -- Catch-all
                   )
reason_text        TEXT NOT NULL
supporting_docs    JSON                   -- Array of file URLs

status             ENUM('Filed', 'Under_Review', 'Re_Evaluated', 'Accepted', 'Rejected') DEFAULT 'Filed'
filed_at           TIMESTAMP NOT NULL
reviewed_by        UUID FK → users
reviewed_at        TIMESTAMP
original_marks     DECIMAL(5,2)
revised_marks      DECIMAL(5,2)
decision_reason    TEXT
```
**Resolution Q42:** The 4 circular appeal types (9.1.1–9.1.4) are preserved. `Fraud_Allegation` and `Other` are system extensions for whistleblowing and miscellaneous corrections.

#### `admission_lists` (Section 8)
```sql
list_id            UUID PRIMARY KEY
application_id     UUID NOT NULL FK → applications
school_id          UUID NOT NULL FK → schools
batch_id           UUID NOT NULL FK → enrollment_batches
list_type          ENUM('Main_List', 'Waiting_List', 'Rejected_List')
position_number    INT                    -- Rank within list
quota_category     ENUM('General', 'Staff', 'Distance', 'Special_Needs')

admitted           BOOLEAN DEFAULT FALSE
admitted_at        TIMESTAMP
admitted_by        UUID FK → users

waiting_position   INT                    -- Sequential within waiting list
promoted_at        TIMESTAMP
promoted_from      INT
```

#### `users`
```sql
user_id            UUID PRIMARY KEY
username           VARCHAR(50) UNIQUE
email              VARCHAR(255)
password_hash      VARCHAR(255)
role               ENUM(
                      'System_Admin',
                      'Zonal_Officer',
                      'School_Principal',
                      'Verification_Officer',
                      'Appeals_Officer',
                      'Parent'
                   )
school_id          UUID FK → schools     -- NULL for zonal/admin
zone_id            UUID                  -- Q66: Zonal officers assigned to zones
is_active          BOOLEAN DEFAULT TRUE
last_login         TIMESTAMP
```

#### `audit_logs` (Section 10)
```sql
log_id             UUID PRIMARY KEY
table_name         VARCHAR(50)
record_id          UUID
action             ENUM('INSERT', 'UPDATE', 'DELETE', 'VERIFY', 'MARK', 'APPEAL_DECIDE', 'LIST_GENERATE', 'PROMOTE')
old_values         JSON
new_values         JSON
performed_by       UUID FK → users
performed_at       TIMESTAMP
ip_address         VARCHAR(45)
reason             TEXT                   -- Q57: Mandatory for MARK, APPEAL_DECIDE, MANUAL_OVERRIDE
```
**Resolution Q56–58:** `AuditOperation` variants must include at minimum: `Create`, `Update`, `Delete`, `Verify`, `Mark`, `AppealDecide`, `ListGenerate`, `Promote`. The `reason` field stores the justification for manual changes.

#### `blacklist` (Section 11)
```sql
blacklist_id       UUID PRIMARY KEY
guardian_id        UUID FK → guardians
application_id     UUID FK → applications  -- The application that triggered blacklisting
reason             TEXT NOT NULL
evidence_url       VARCHAR(500)
blacklisted_at     TIMESTAMP
expires_at         TIMESTAMP              -- Section 11.6: Typically 3 years
blacklisted_by     UUID FK → users
status             ENUM('Active', 'Expired', 'Revoked')
```
**Resolution Q44, 55:** When a guardian is blacklisted, all their applications in the current batch are flagged. Existing `Admitted` statuses are **not** automatically reversed (legal review required), but future applications are blocked.

#### `notifications`
```sql
notification_id    UUID PRIMARY KEY
user_id            UUID FK → users
channel            ENUM('SMS', 'Email', 'Portal')
subject            VARCHAR(255)
body               TEXT
status             ENUM('Pending', 'Sent', 'Failed')
sent_at            TIMESTAMP
created_at         TIMESTAMP
```

---

## 5. Application Logic & Business Rules

### 5.1 Application Submission Flow

```
[Parent Registration] 
    → [Create Child Profile] 
    → [Select School] 
    → [Fill Guardian Details] 
    → [Enter Address with Map Pin] 
    → [Declare Categories: Staff/Sibling/Alumni/Govt] 
    → [Upload Documents per Category] 
    → [Auto-Calculate Distance] 
    → [Submit] 
    → [Generate Reference Number: G1-YYYY-######]
```

**Validation Rules:**
- **Age Check (Section 4.1):** `DOB <= (admission_year - 5 years) - 1 day` (i.e., 5 years by Jan 31).
- **Duplicate Check:** One application per child per school per batch. Unique on `(child_id, school_id, batch_id)`.
- **Document Completeness:** Cannot submit if mandatory docs missing based on declared categories.
- **Distance Verification:** Address must be geocoded. If geocoding fails, flag for manual verification.
- **School Type Matching:** Section 4.3 — Medium of instruction must match.

### 5.2 Document Verification Workflow (Section 6 & 9)

```
Submitted → [Auto Validation] → [Officer Review] → Verified/Rejected/Flagged
```

**Auto-Validation (Q46–50):**
1. **Format Checks (Not full OCR):** File type, size, readability. OCR extracts text for officer assistance but does **not** auto-verify content.
2. **NIC Check Digit:** Sri Lankan NIC format validation (algorithm implemented).
3. **File Integrity:** SHA-256 hash comparison on upload vs storage.
4. **Birth Registry:** Format validation only; API integration is **future work** (not yet available).
5. **GN Division:** Local lookup table; external API is **future work**.

**Officer Verification Queue:**
- Documents grouped by school for zonal officers.
- Section 6.2.1: Residence proof checked against GN division database (local table).
- Section 6.2.4: Staff letters cross-referenced with `staff_details` table (school-level data only; national payroll DB is **future work**).

### 5.3 Marking Calculation Engine (Section 7)

**Phase 1: Category Eligibility (Q26–27)**
- Categories are **additive**. Maximum possible = 100.00 marks.
- A guardian may qualify for multiple categories (e.g., Staff + Sibling). All applicable categories are summed.

**Phase 2: Proximity Scoring (Section 7.2 — 50%)**

Distance bands (raw marks out of 100):

| Distance | Raw Marks |
|---|---|
| < 0.5 km | 100 |
| 0.5 – 1.0 km | 80 |
| 1.0 – 2.0 km | 60 |
| 2.0 – 3.0 km | 40 |
| 3.0 – 5.0 km | 20 |
| > 5.0 km | 10 |

```python
# Calculation
weighted_proximity = (raw_proximity / 100) * 50.00
```

**Residence Adjustments (Section 7.2.1.1, Q29–31):**
- **Rented + <0.5km:** Requires 6 months utility bills; otherwise 20% penalty (raw × 0.8).
- **Apartment:** Distance measured from main entrance.
- **Road Network:** Preferred if data available; fallback to Haversine straight-line.
- **GN Boundary:** If address is on boundary, use school-side measurement (manual officer flag).

**Phase 3: Staff Scoring (Section 7.3 — 25%)**
```python
if staff.is_current and staff.school_id == application.school_id:
    raw_staff = 100
    if staff.distance_from_residence_km > 100 and not boarding_proof:
        raw_staff = 80  # 20% reduction
    weighted_staff = (raw_staff / 100) * 25.00
```
- Academic/Permanent Non-academic: Full 25%
- Temporary Non-academic: 50% of 25% = 12.5%
- Contract: Case by case (officer discretion, logged in `marks_breakdown.calculation_rule`)

**Phase 4: Sibling Scoring (Section 7.4 — 14%)**
- Same distance bands as proximity.
- Sibling's address is the **application address** (same household), not a separate address (Q33).
- If sibling verified and in same school:
```python
weighted_sibling = (raw_sibling / 100) * 14.00
```

**Phase 5: Past Pupil Scoring (Section 7.5 — 6%)**
```python
if alumni.verified and alumni.school_id == application.school_id:
    raw_alumni = 100
    if alumni.highest_grade in ['GCE_AL', 'GCE_OL']:
        raw_alumni = 100
    elif alumni.highest_grade == 'Grade_11':
        raw_alumni = 80
    elif alumni.highest_grade == 'Grade_10':
        raw_alumni = 60
    else:
        raw_alumni = 40
    weighted_alumni = (raw_alumni / 100) * 6.00
```
`highest_grade` is determined from `past_pupil_details` table (Q34).

**Phase 6: Government Service (Section 7.6 — 4%)**
```python
if guardian.is_govt_employee and not guardian.is_school_staff:
    raw_govt = 100
    if guardian.govt_service_years >= 20: raw_govt = 100
    elif guardian.govt_service_years >= 15: raw_govt = 80
    elif guardian.govt_service_years >= 10: raw_govt = 60
    elif guardian.govt_service_years >= 5:  raw_govt = 40
    else: raw_govt = 20
    weighted_govt = (raw_govt / 100) * 4.00
```
Thresholds are **from the circular** (Q35), not configurable per cycle.

**Phase 7: Special Cases (Section 7.7 — 1%)**
```python
raw_special = 0
if child.disability_status: raw_special += 40
if guardian.is_from_conflict_area: raw_special += 25
if guardian.is_from_disaster_area: raw_special += 25
if guardian.is_single_parent: raw_special += 10
raw_special = min(raw_special, 100)
weighted_special = (raw_special / 100) * 1.00
```

**Phase 8: Total (Q28)**
```python
total_marks = weighted_proximity + weighted_staff + weighted_sibling + weighted_alumni + weighted_govt + weighted_special
application.total_marks = round(total_marks, 2)
```
If no categories apply, total = proximity minimum (10% of 50% = 5.00) + 0 = **5.00**, not NULL.

### 5.4 Ranking & List Generation (Section 8)

```python
# Step 1: Rank all Completed applications per school
applications = SELECT * FROM applications 
              WHERE school_id = ? AND status = 'Completed' AND batch_id = ?
              ORDER BY total_marks DESC, proximity_marks DESC, submitted_at ASC

# Step 2: Apply Quota (Section 4.1, Q36–38)
quota = school.grade_1_quota  # 35 or 40

# Reserved quotas
staff_quota = max(5, count(staff_applicants))  # Minimum 5 seats reserved for staff
special_quota = max(1, ceil(quota * 0.01))       # 1% or minimum 1 for special needs

# If reserved applicants < reserved seats, redistribute to general proximity (Q36)
main_list = []
waiting_list = []
# ... (detailed allocation algorithm)
```

**Tie-Breaking (Section 7.1.2, Q39):**
1. Higher total marks
2. Higher proximity marks (50% category)
3. Earlier submission timestamp
4. Random lottery (seeded deterministic random for reproducibility, logged in audit)

**Waiting List Size (Q38):** Default 20, but configurable per batch as `batch.waiting_list_size`.

### 5.5 Appeals Workflow (Section 9, Q40–45)

```
[Parent Files Appeal within 14 days] 
    → [System Locks Application from withdrawal] 
    → [Zonal Officer Review] 
    → [Re-evaluation if needed] 
    → [Decision] 
    → [Update Marks/Status if Accepted]
    → [Re-generate affected lists]
```

- **Filing Window:** 14 days from `batch.list_published_at` (Q41). Tracked in `batch.appeal_deadline_at`.
- **Re-evaluation:** Old marks preserved in `appeals.original_marks`. New marks stored in `appeals.revised_marks` and `marks_breakdown` gets a new row with `calculation_rule = 'APPEAL_OVERRIDE'`.
- **Notification:** SMS + Email + Portal update on decision.
- **Fraud Blacklist:** If fraud confirmed, guardian blacklisted for 3 years. If accusation malicious, accuser blacklisted (Q45 — determined by Appeals Officer panel, logged with evidence).

### 5.6 Final Admission Confirmation

```python
# After appeals closed
for app in main_list:
    if not app.withdrawn:
        app.status = 'Admitted'
        generate_admission_letter(app)      # PDF generation
        notify_parent(app.guardian_id, "ADMITTED")
        increment_school_roll(app.school_id)

# Waiting list promotion (Section 8.3)
def promote_from_waiting_list(school_id, batch_id):
    vacant = count_withdrawals(school_id, batch_id)
    waiting = get_waiting_list(school_id, batch_id, order_by='position')
    for i in range(vacant):
        promote_to_main(waiting[i])
        notify_parent(waiting[i].guardian_id, "PROMOTED_FROM_WAITING")
```

### 5.7 Fraud & Malpractice Handling (Section 11, Q51–55)

**Detection Triggers:**
- **Same Address >3 apps (Q51):** Exact match on `address_line_1` + `gs_division` + `postal_code` within same school and batch. Radius check is future enhancement.
- **Image Hash (Q52):** SHA-256 in `documents.file_hash` used for duplicate detection across applications.
- **Distance Anomaly (Q53):** No "declared distance" field exists; anomaly is detected by officer review if calculated distance seems inconsistent with address.
- **Staff Verification (Q54):** Cross-reference with `staff_details` table (school-level). National payroll DB integration is **future work**.

**Actions:**
1. **Flag:** Status remains, officer investigates.
2. **Confirm Fraud:** Application → `Rejected`. Guardian → `blacklist` table. Audit log created.
3. **Existing Applications (Q55):** When blacklisted, current batch applications are `Rejected`. Past admissions are flagged for legal review, not auto-reversed.

---

## 6. Data Retention & Privacy (Q60–63)

| Phase | Rule | Implementation |
|---|---|---|
| Active Cycle | Full CRUD | Standard operations |
| Post-Admission +1 year | Archive to read-only | `applications` moved to `applications_archive` table; original kept as read-only |
| +7 years | Retain for audit | Full records retained per Section 10.2 |
| +7 years | Anonymize | `children.full_name`, `guardians.nic_number`, `guardians.contact_phone` hashed (SHA-256) for statistical use |
| Files | `file_url` retention | Document files retained for 7 years; URLs updated to archive storage tier |

---

## 7. User Roles & Permissions (Q64–66)

| Role | School/Zone | Permissions |
|---|---|---|
| `System_Admin` | NULL | Full system access |
| `Zonal_Officer` | `zone_id` | View all schools in zone, manage appeals, generate lists |
| `School_Principal` | `school_id` | View own school data, verify staff details |
| `Verification_Officer` | `school_id` or `zone_id` | Verify documents, flag fraud |
| `Appeals_Officer` | `zone_id` | Review appeals, override marks |
| `Parent` | NULL | View own application only (limited view) |

**RBAC Mapping:** Implementation permissions like `G1ApplicationUpdate` map to:
- `Verification_Officer` + `Appeals_Officer`: Update
- `System_Admin`: Delete
- `Parent`: Read (own only)

---

## 8. Implementation Gaps & Roadmap (Q15 Summary)

| Feature | Status | Priority | Notes |
|---|---|---|---|
| `children` / `guardians` as separate tables | **Required** | P0 | Align schema; denormalized implementation must be migrated |
| Auto OCR | **Partial** | P1 | OCR extracts text; officer makes final decision |
| Birth Registry API | **Not Available** | P2 | Format validation only |
| NIC Check Digit | **Implemented** | P0 | Algorithm active |
| Google Maps API / Road Network | **Partial** | P1 | Haversine implemented; road network is future enhancement |
| GN Division DB Lookup | **Local Table** | P1 | Local lookup; national API is future work |
| Fraud Detection Engine | **Partial** | P1 | Pattern rules active; ML enhancement is future |
| Blacklist Table | **Required** | P0 | Must be added |
| Notification Service (SMS/Email) | **Required** | P0 | Queue-based implementation needed |
| Judicial Approval Workflow | **Not Implemented** | P2 | Manual process logged in audit |
| PDF Admission Letter | **Required** | P1 | Template-based generation |
| Public Dashboard | **Required** | P1 | Read-only aggregated queries |
| Data Archival | **Not Implemented** | P2 | Scheduled job after 1 year |
| Personal Identifier Hashing | **Not Implemented** | P2 | Batch job after 7 years |
| Lottery Tie-Breaker | **Required** | P0 | Deterministic seeded random |

---

## 9. Key Constraints & Indexes

```sql
-- Prevent duplicate applications per child/school/batch
ALTER TABLE applications ADD CONSTRAINT uq_app_child_school_batch 
    UNIQUE (child_id, school_id, batch_id);

-- Reference number uniqueness
ALTER TABLE applications ADD CONSTRAINT uq_reference_no 
    UNIQUE (reference_no);

-- Marks integrity
ALTER TABLE marks_breakdown ADD CONSTRAINT chk_raw_marks 
    CHECK (raw_marks <= max_raw_marks);

-- Age validation
CREATE TRIGGER trg_check_age BEFORE INSERT ON applications
FOR EACH ROW EXECUTE FUNCTION validate_age_against_batch();

-- Staff must belong to applied school
ALTER TABLE staff_details ADD CONSTRAINT chk_staff_school 
    CHECK (school_id IS NOT NULL);

-- Performance indexes
CREATE INDEX idx_app_school_batch_status ON applications(school_id, batch_id, enrollment_status);
CREATE INDEX idx_app_marks ON applications(total_marks DESC) WHERE enrollment_status = 'Completed';
CREATE INDEX idx_app_rank ON applications(school_id, batch_id, rank_number);
CREATE INDEX idx_docs_app_status ON documents(application_id, verification_status);
CREATE INDEX idx_appeals_status ON appeals(status, reviewed_at);
CREATE INDEX idx_audit_record ON audit_logs(table_name, record_id, performed_at);
CREATE INDEX idx_address_gs ON addresses(gs_division, district);
```

---

## 10. Resolution Index (All 75 Questions)

| Q# | Topic | Resolution |
|---|---|---|
| 1–6 | Status Mapping | Documented in §2.1–2.2 |
| 7–9 | `wizard_step` | Transient UI field, documented in §2.3 |
| 10–13 | Missing Tables | `children`, `guardians`, `districts` restored; `audit_logs` schema aligned |
| 14–17 | Field Names | `child_id` restored; `guardian_id` restored; `list_category` enum aligned; `applied_year` derived from batch |
| 18–21 | Status Transitions | Documented in §2.2; backward transitions restricted |
| 22–25 | Batch Lifecycle | Documented in §4.1; year derived from batch |
| 26–35 | Scoring Logic | Exact circular rules in §5.3; additive categories; distance bands; service years from circular |
| 36–40 | Quota & Lists | Reserved quotas, waiting list size, tie-breakers documented in §5.4 |
| 41–45 | Appeals | 14-day window, 6 appeal types, mark preservation, blacklist enforcement |
| 46–50 | Document Verification | OCR assistive only; NIC check implemented; GN lookup local; staff cross-ref local |
| 51–55 | Fraud Detection | Exact match + hash; no declared distance field; payroll DB future work |
| 56–59 | Audit | `reason` field mandatory for manual changes; judicial approval manual |
| 60–63 | Data Retention | 7-year retention, 1-year archive, hashing after 7 years |
| 64–66 | User Roles | 6 roles mapped to RBAC permissions; zonal assignment via `zone_id` |
| 67–69 | Circular Relationship | Confirmed as Circular 25/2026; all section references aligned |
| 70–75 | Additional Inconsistencies | `APPLICATION_HISTORY` deprecated in favor of `audit_logs`; defaults aligned; `reference_no` format fixed; FKs enforced |

---

*End of Document*
