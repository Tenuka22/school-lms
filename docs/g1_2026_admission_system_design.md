# Grade 1 School Admission System - Database Design & Application Logic
## Based on Current Admission Circular

---

## 1. System Overview

The system manages the centralized admission of children to Grade 1 of government schools in Sri Lanka. It handles:
- **Multi-criteria weighted scoring** (Proximity, Staff, Siblings, Alumni, Government Service, Special Cases)
- **Document verification workflows** with fraud detection
- **Appeals processing** with re-evaluation
- **Final list generation** with quota management
- **Audit trails** for transparency

---

## 2. Entity Relationship Diagram (Logical)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    SCHOOL       │     │   APPLICATION    │     │    CHILD        │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ PK school_id    │◄────┤ PK application_id│◄────┤ PK child_id     │
│    name_si      │     │    ref_number    │     │    full_name    │
│    name_en      │     │    applied_year  │     │    dob          │
│    address      │     │    status        │     │    gender       │
│    type (1AB..) │     │    total_marks   │     │    birth_reg_no │
│    category     │     │    rank          │     │    nic (if any) │
│    quota_limit  │     │    submitted_at  │     │    photo_url    │
└─────────────────┘     │    verified_at   │     └─────────────────┘
                        │    FK school_id  │              │
                        │    FK guardian_id│            │
                        └──────────────────┘            │
                                   │                    │
                        ┌──────────┘                    │
                        ▼                               ▼
               ┌─────────────────┐              ┌─────────────────┐
               │  APPLICATION_   │              │    GUARDIAN     │
               │    HISTORY      │              ├─────────────────┤
               ├─────────────────┤              │ PK guardian_id  │
               │ PK history_id   │              │    type (M/F/O) │
               │    action       │              │    full_name    │
               │    old_status   │              │    nic          │
               │    new_status   │              │    occupation   │
               │    actor_id     │              │    workplace    │
               │    timestamp    │              │    is_staff     │
               └─────────────────┘              │    is_alumni    │
                                               │    is_govt_emp  │
                                               │    service_years│
                                               └─────────────────┘
                                                        │
                        ┌───────────────────────────────┘
                        ▼
               ┌─────────────────┐
               │    ADDRESS      │
               ├─────────────────┤
               │ PK address_id   │
               │    line_1       │
               │    line_2       │
               │    city         │
               │    district     │
               │    gs_division  │
               │    latitude     │
               │    longitude    │
               │    distance_km  │ ← Calculated
               │    FK app_id    │
               └─────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    SIBLING      │     │    DOCUMENT      │     │    MARKS        │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ PK sibling_id   │     │ PK document_id   │     │ PK mark_id      │
│    full_name    │     │    type          │     │    FK app_id    │
│    school_name  │     │    file_url      │     │    category     │
│    grade        │     │    verified      │     │    raw_score    │
│    FK app_id    │     │    verified_by   │     │    weight_pct   │
└─────────────────┘     │    verified_at   │     │    final_score  │
                        │    rejection_reason│   │    calculated_at│
                        └──────────────────┘     └─────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    APPEAL       │     │   ADMISSION      │     │     USER        │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ PK appeal_id    │     │ PK admission_id  │     │ PK user_id      │
│    FK app_id    │     │    FK app_id     │     │    username     │
│    reason       │     │    list_type     │     │    role         │
│    status       │     │    (Main/Wait)   │     │    school_id    │
│    filed_at     │     │    position      │     │    is_active    │
│    reviewed_at  │     │    admitted_at   │     └─────────────────┘
│    decision     │     └──────────────────┘
│    new_marks    │
└─────────────────┘

┌─────────────────┐     ┌──────────────────┐
│  STAFF_DETAIL   │     │  PAST_PUPIL      │
├─────────────────┤     ├──────────────────┤
│ PK staff_id     │     │ PK alumni_id     │
│    FK guardian_id│    │    FK guardian_id│
│    FK school_id │     │    FK school_id  │
│    designation  │     │    left_year     │
│    service_from │     │    highest_grade │
│    service_to   │     │    verified      │
│    is_current   │     └──────────────────┘
└─────────────────┘
```

---

## 3. Database Schema (Physical)

### 3.1 Core Tables

#### `schools`
```sql
school_id          UUID PRIMARY KEY
school_name_si     VARCHAR(255) NOT NULL
school_name_en     VARCHAR(255)
school_type        ENUM('1AB', '1C', 'Type-2', 'Type-3') -- National/Provincial
address            TEXT
district_id        UUID FK → districts
category           ENUM('Urban', 'Rural', 'Difficult', 'Estate') -- For quota adjustments
grade_1_quota      INT DEFAULT 35 -- Section 4.1: Minimum 35, can be 40 for popular schools
geo_location       POINT (lat, long)
created_at         TIMESTAMP
status             ENUM('Active', 'Inactive')
```

#### `applications` (Central Entity)
```sql
application_id     UUID PRIMARY KEY
reference_no       VARCHAR(20) UNIQUE -- System generated (e.g., G1-2026-123456)
applied_year       YEAR NOT NULL DEFAULT 2027 -- Section 4.1: For 2027 academic year
school_id          UUID FK → schools
child_id           UUID FK → children
guardian_id        UUID FK → guardians

-- Application Status Workflow
status             ENUM(
                      'Draft',
                      'Submitted', 
                      'Docs_Pending',
                      'Under_Verification',
                      'Verified',
                      'Marked',
                      'Shortlisted',
                      'Appealed',
                      'Finalized',
                      'Admitted',
                      'Rejected',
                      'Withdrawn'
                   ) DEFAULT 'Draft'

-- Scoring (Section 7)
total_marks        DECIMAL(5,2) DEFAULT 0.00
rank_number        INT -- Within school
list_category      ENUM('Main', 'Waiting', 'Not_Selected')

-- Metadata
submitted_at       TIMESTAMP
verified_at        TIMESTAMP
verified_by        UUID FK → users
finalized_at       TIMESTAMP
ip_address         VARCHAR(45) -- Audit
user_agent         TEXT -- Audit
```

#### `children`
```sql
child_id           UUID PRIMARY KEY
full_name          VARCHAR(255) NOT NULL
date_of_birth      DATE NOT NULL -- Section 4.1: Must be 5 years by Jan 31
birth_reg_number   VARCHAR(50) UNIQUE -- From Birth Registry
gender             ENUM('Male', 'Female')
photo_url          VARCHAR(500)
religion           VARCHAR(50) -- Section 6.2.5: For religious quota
nationality        VARCHAR(50) DEFAULT 'Sri Lankan'
disability_status  BOOLEAN DEFAULT FALSE -- Section 7.7: Special 1% category
disability_type    VARCHAR(100)
created_at         TIMESTAMP
```

#### `guardians` (Can be Parent/Relative)
```sql
guardian_id        UUID PRIMARY KEY
relationship_type  ENUM('Mother', 'Father', 'Both', 'Legal_Guardian', 'Relative')
full_name          VARCHAR(255) NOT NULL
nic_number         VARCHAR(12) UNIQUE -- National ID
contact_phone      VARCHAR(15)
contact_email      VARCHAR(255)
occupation         VARCHAR(100)
workplace_name     VARCHAR(255)
workplace_address  TEXT
is_govt_employee   BOOLEAN DEFAULT FALSE -- Section 7.5
govt_service_years INT -- For marking calculation
is_school_staff    BOOLEAN DEFAULT FALSE -- Section 7.3
is_past_pupil      BOOLEAN DEFAULT FALSE -- Section 7.4
past_pupil_verified BOOLEAN DEFAULT FALSE
income_level       DECIMAL(12,2) -- For potential means testing
address_id         UUID FK → addresses
```

#### `addresses` (Residence - Critical for 50% proximity score)
```sql
address_id         UUID PRIMARY KEY
application_id     UUID FK → applications
address_line_1     VARCHAR(255)
address_line_2     VARCHAR(255)
city               VARCHAR(100)
district           VARCHAR(100)
province           VARCHAR(100)
gs_division        VARCHAR(100) -- Grama Niladhari Division
postal_code        VARCHAR(10)

-- Geospatial (Section 7.1.5: Google Map verification)
latitude           DECIMAL(10,8)
longitude          DECIMAL(11,8)
distance_to_school_km DECIMAL(8,3) -- Auto-calculated via Haversine
verified_by_map    BOOLEAN DEFAULT FALSE

-- Section 7.1.5: Ownership proof type
residence_type     ENUM('Owned', 'Rented', 'Relative', 'Other')
ownership_proof    VARCHAR(50) -- Deed, Lease, GN Certificate
```

### 3.2 Supporting Tables

#### `siblings` (Section 7.4: 14% category)
```sql
sibling_id         UUID PRIMARY KEY
application_id     UUID FK → applications
sibling_name       VARCHAR(255)
school_id          UUID FK → schools -- Must be same applied school
current_grade      INT -- Currently studying
admission_year     YEAR
verified           BOOLEAN DEFAULT FALSE
verification_doc   VARCHAR(500) -- School attendance certificate
```

#### `staff_details` (Section 7.3: 25% category)
```sql
staff_id           UUID PRIMARY KEY
guardian_id        UUID FK → guardians
school_id          UUID FK → schools
designation        VARCHAR(100) -- Teacher/Principal/Non-academic
employment_type    ENUM('Permanent', 'Temporary', 'Contract')
service_start_date DATE
service_end_date   DATE -- NULL if current
is_current         BOOLEAN DEFAULT TRUE
verification_doc   VARCHAR(500) -- Appointment letter/payslip
distance_from_residence_km DECIMAL(5,2) -- Section 7.3.1: If >100km special rules
```

#### `past_pupil_details` (Section 7.4: 6% category)
```sql
alumni_id          UUID PRIMARY KEY
guardian_id        UUID FK → guardians
school_id          UUID FK → schools
highest_grade      VARCHAR(20)
year_left          YEAR
left_reason        ENUM('Completed', 'Transferred', 'Other')
verified           BOOLEAN DEFAULT FALSE
verification_method ENUM('School_Record', 'Exam_Certificate', 'Affidavit')
```

#### `documents` (Section 6: Required Documents)
```sql
document_id        UUID PRIMARY KEY
application_id     UUID FK → applications
document_type      ENUM(
                      'Birth_Certificate',
                      'Guardian_NIC',
                      'Residence_Proof', -- Section 6.2.1: Deed/Lease/GN Cert
                      'Sibling_School_Certificate',
                      'Staff_Appointment_Letter',
                      'Staff_Service_Certificate',
                      'Past_Pupil_Certificate',
                      'Past_Pupil_Exam_Cert',
                      'Govt_Service_Certificate',
                      'Disability_Certificate',
                      'Income_Certificate',
                      'Baptism_Certificate', -- Section 6.2.5: For religion
                      'Other'
                   )
file_url           VARCHAR(500)
file_hash          VARCHAR(64) -- SHA-256 for integrity
uploaded_at        TIMESTAMP

-- Verification workflow
verification_status ENUM('Pending', 'Verified', 'Rejected', 'Flagged') DEFAULT 'Pending'
verified_by        UUID FK → users
verified_at        TIMESTAMP
rejection_reason   TEXT
fraud_flag         BOOLEAN DEFAULT FALSE -- Section 11: Fraud detection
```

#### `marks_breakdown` (Section 7: Detailed Scoring)
```sql
mark_id            UUID PRIMARY KEY
application_id     UUID FK → applications
category_code      VARCHAR(10) -- PROX, STAFF, SIBLING, ALUMNI, GOVT, SPECIAL

-- Raw vs Weighted
raw_marks          DECIMAL(5,2)
max_raw_marks      DECIMAL(5,2)
weight_percentage  DECIMAL(4,2) -- e.g., 50.00 for proximity
weighted_score     DECIMAL(5,2) -- (raw/max) * weight

-- Distance-specific fields (for PROX category)
distance_km        DECIMAL(6,3)
distance_band      ENUM('<0.5', '0.5-1', '1-2', '2-3', '3-5', '>5')

-- Calculation metadata
calculated_at      TIMESTAMP
calculation_rule   VARCHAR(50) -- Which rule applied
```

#### `appeals` (Section 9: Appeals Process)
```sql
appeal_id          UUID PRIMARY KEY
application_id     UUID FK → applications
appeal_reference   VARCHAR(20) UNIQUE

-- Appeal details
appeal_type        ENUM(
                      'Distance_Calculation',
                      'Document_Rejection', 
                      'Category_Eligibility',
                      'Marking_Error',
                      'Fraud_Allegation',
                      'Other'
                   )
reason_text        TEXT NOT NULL
supporting_docs    JSON -- Array of file URLs

-- Workflow
status             ENUM('Filed', 'Under_Review', 'Re_Evaluated', 'Accepted', 'Rejected') DEFAULT 'Filed'
filed_at           TIMESTAMP
reviewed_by        UUID FK → users
reviewed_at        TIMESTAMP
original_marks     DECIMAL(5,2)
revised_marks      DECIMAL(5,2)
decision_reason    TEXT
```

#### `admission_lists` (Section 8: Final List)
```sql
admission_id       UUID PRIMARY KEY
application_id     UUID FK → applications
school_id          UUID FK → schools
list_type          ENUM('Main_List', 'Waiting_List', 'Rejected_List')
position_number    INT -- Rank within list
quota_category     ENUM('General', 'Staff', 'Distance', 'Special_Needs')

-- Final status
admitted           BOOLEAN DEFAULT FALSE
admitted_at        TIMESTAMP
admitted_by        UUID FK → users

-- Waiting list specific
waiting_position   INT
promoted_at        TIMESTAMP -- If promoted from waiting
promoted_from      INT -- Previous position
```

#### `users` (System Access)
```sql
user_id            UUID PRIMARY KEY
username           VARCHAR(50) UNIQUE
email              VARCHAR(255)
role               ENUM(
                      'System_Admin',
                      'Zonal_Officer',
                      'School_Principal', 
                      'Verification_Officer',
                      'Appeals_Officer',
                      'Parent' -- Limited view
                   )
school_id          UUID FK → schools -- NULL for zonal/admin
is_active          BOOLEAN DEFAULT TRUE
last_login         TIMESTAMP
```

#### `audit_logs` (Section 10: Transparency)
```sql
log_id             UUID PRIMARY KEY
table_name         VARCHAR(50)
record_id          UUID
action             ENUM('INSERT', 'UPDATE', 'DELETE', 'VERIFY', 'MARK', 'APPEAL_DECIDE')
old_values         JSON
new_values         JSON
performed_by       UUID FK → users
performed_at       TIMESTAMP
ip_address         VARCHAR(45)
```

---

## 4. Application Logic & Business Rules

### 4.1 Application Submission Flow

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
    → [Generate Reference Number]
```

**Validation Rules:**
- **Age Check (Section 4.1):** Child MUST be 5 years old by January 31 of the admission year. `DOB <= (Admission_Year - 5 years) - 1 day`
- **Duplicate Check:** One application per child per school. Unique constraint on `(child_id, school_id, applied_year)`.
- **Document Completeness:** Cannot submit if mandatory docs missing based on declared categories.
- **Distance Verification:** Address must be geocoded. If Google Maps API fails, flag for manual verification.
- **School Type Matching:** Section 4.3 - Applications must match Sinhala/Tamil/English medium of school.

### 4.2 Document Verification Workflow (Section 6 & 9)

```
Submitted → [Auto OCR Check] → [Officer Review] → Verified/Rejected/Flagged
```

**Logic:**
1. **Auto-Validation:**
   - Birth Certificate: Validate registration number format against Birth Registry API.
   - NIC: Check digit validation for Sri Lankan NIC format.
   - File Integrity: Compare SHA-256 hash on upload vs storage.

2. **Officer Verification Queue:**
   - Documents grouped by school for zonal officers.
   - Section 6.2.1: Residence proof must be checked against GN division database.
   - Section 6.2.4: Staff letters must be cross-referenced with `staff_details` table.

3. **Fraud Detection (Section 11):**
   - **Pattern Analysis:** Flag if same address used for >3 applications to same school.
   - **Document Duplication:** Image hash comparison to detect reused documents.
   - **Distance Anomaly:** If calculated distance differs >20% from declared distance.
   - **Section 11.3:** If fraud confirmed, application blacklisted and legal action triggered.

4. **Rejection Handling:**
   - Parent notified with specific reason.
   - 7-day window to re-submit corrected documents (Section 5.2).

### 4.3 Marking Calculation Engine (Section 7)

This is the core algorithm. Total marks are calculated out of the declared category weights.

#### Phase 1: Category Eligibility Check
```python
# Pseudologic
if guardian.is_school_staff and staff.school_id == application.school_id:
    categories.append('STAFF')  # 25%

if sibling.exists_in_same_school and sibling.verified:
    categories.append('SIBLING')  # 14%

if guardian.is_past_pupil and alumni.school_id == application.school_id:
    categories.append('ALUMNI')  # 6%

if guardian.is_govt_employee:
    categories.append('GOVT')  # 4%

# Proximity is ALWAYS calculated (50%)
categories.append('PROXIMITY')  # 50%

# Special cases (1%) - disability, etc.
if child.disability_status:
    categories.append('SPECIAL')  # 1%
```

#### Phase 2: Proximity Scoring (Section 7.2 - 50% Weight)

**Distance Calculation:**
```python
# Haversine formula between school geo_point and address geo_point
distance_km = calculate_haversine(school.lat, school.lon, address.lat, address.lon)

# Section 7.1.5: Verification
if distance_km <= 0.1:  # 100 meters
    verification_required = True  # Physical verification by officer

# Section 7.2.1: Distance bands and marks (out of 100, then weighted to 50%)
if distance_km < 0.5:
    raw_proximity = 100
elif distance_km < 1.0:
    raw_proximity = 80
elif distance_km < 2.0:
    raw_proximity = 60
elif distance_km < 3.0:
    raw_proximity = 40
elif distance_km < 5.0:
    raw_proximity = 20
else:
    raw_proximity = 10  # Section 7.2.1: Minimum for any applicant

# Section 7.1.5: Residence ownership adjustment
if address.residence_type == 'Rented' and distance_km < 0.5:
    # Require additional proof: 6 months utility bills
    if not utility_bills_provided:
        raw_proximity *= 0.8  # 20% penalty

weighted_proximity = (raw_proximity / 100) * 50.00
```

**Additional Proximity Rules (Section 7.2.1.1):**
- **Built Environment:** If residence is apartment building, distance measured from main entrance.
- **Road Network:** Section 7.1.5 - Walking distance via road network preferred over straight-line if data available.
- **GN Division Boundary:** If address is on boundary of GN division, use school-side measurement.

#### Phase 3: Staff Scoring (Section 7.3 - 25% Weight)

```python
# Section 7.3: Staff children get 25% if verified
if staff.is_current and staff.school_id == application.school_id:
    raw_staff = 100

    # Section 7.3.1: Distance penalty for staff
    if staff.distance_from_residence_km > 100:
        # Must provide boarding proof or face reduction
        if not boarding_proof:
            raw_staff = 80  # 20% reduction

    weighted_staff = (raw_staff / 100) * 25.00
else:
    weighted_staff = 0
```

**Staff Categories (Section 7.3.2-7.3.4):**
- Academic staff: Full 25%
- Non-academic permanent: Full 25%  
- Non-academic temporary: 50% of 25% = 12.5%
- Contract: Case by case (stored in `staff.employment_type`)

#### Phase 4: Sibling Scoring (Section 7.4 - 14% Weight)

```python
# Section 7.4: Sibling in same school
if sibling.verified and sibling.school_id == application.school_id:
    raw_sibling = 100

    # Section 7.4.1: Distance bands for siblings (similar to proximity but separate calc)
    sibling_distance = calculate_distance(sibling.address, school)

    if sibling_distance < 0.5: raw_sibling = 100
    elif sibling_distance < 1.0: raw_sibling = 80
    elif sibling_distance < 2.0: raw_sibling = 60
    elif sibling_distance < 3.0: raw_sibling = 40
    elif sibling_distance < 5.0: raw_sibling = 20
    else: raw_sibling = 10

    weighted_sibling = (raw_sibling / 100) * 14.00
else:
    weighted_sibling = 0
```

#### Phase 5: Past Pupil Scoring (Section 7.5 - 6% Weight)

```python
# Section 7.5: Alumni children
if alumni.verified and alumni.school_id == application.school_id:
    raw_alumni = 100

    # Section 7.5.1: Highest grade completed matters
    if alumni.highest_grade in ['GCE_AL', 'GCE_OL']:
        raw_alumni = 100
    elif alumni.highest_grade == 'Grade_11':
        raw_alumni = 80
    elif alumni.highest_grade == 'Grade_10':
        raw_alumni = 60
    else:
        raw_alumni = 40

    weighted_alumni = (raw_alumni / 100) * 6.00
else:
    weighted_alumni = 0
```

#### Phase 6: Government Service (Section 7.6 - 4% Weight)

```python
# Section 7.6: Govt employees not staff of this school
if guardian.is_govt_employee and not guardian.is_school_staff:
    raw_govt = 100

    # Section 7.6.1: Service years
    if guardian.govt_service_years >= 20:
        raw_govt = 100
    elif guardian.govt_service_years >= 15:
        raw_govt = 80
    elif guardian.govt_service_years >= 10:
        raw_govt = 60
    elif guardian.govt_service_years >= 5:
        raw_govt = 40
    else:
        raw_govt = 20

    weighted_govt = (raw_govt / 100) * 4.00
else:
    weighted_govt = 0
```

#### Phase 7: Special Cases (Section 7.7 - 1% Weight)

```python
# Section 7.7: Special circumstances
raw_special = 0

if child.disability_status:
    raw_special += 40  # Section 7.7.2

if guardian.is_from_conflict_area:  # Section 7.7.1
    raw_special += 25

if guardian.is_from_disaster_area:
    raw_special += 25

if guardian.is_single_parent:
    raw_special += 10

# Cap at 100
raw_special = min(raw_special, 100)
weighted_special = (raw_special / 100) * 1.00
```

#### Phase 8: Total Calculation

```python
total_marks = (
    weighted_proximity + 
    weighted_staff + 
    weighted_sibling + 
    weighted_alumni + 
    weighted_govt + 
    weighted_special
)

# Store in marks_breakdown table for audit
# Round to 2 decimal places
application.total_marks = round(total_marks, 2)
```

### 4.4 Ranking & List Generation (Section 8)

```python
# Step 1: Rank all verified applications per school
applications = SELECT * FROM applications 
              WHERE school_id = ? AND status = 'Marked' AND applied_year = 2027
              ORDER BY total_marks DESC, submitted_at ASC  # Tie-breaker: first come first served

# Step 2: Apply Quota (Section 4.1)
quota = school.grade_1_quota  # e.g., 35 or 40

main_list = applications[:quota]
waiting_list = applications[quota:quota+20]  # Keep 20 in waiting
rejected = applications[quota+20:]

# Step 3: Insert into admission_lists
for idx, app in enumerate(main_list):
    insert_admission_list(app, 'Main_List', idx+1)

for idx, app in enumerate(waiting_list):
    insert_admission_list(app, 'Waiting_List', idx+1)
```

**Tie-Breaking Rules (Section 7.1.2):**
1. Higher total marks
2. If tie: Higher proximity marks (50% category)
3. If still tie: Earlier submission timestamp
4. If still tie: Random lottery (logged in audit)

**Reserved Quotas within Main List:**
- Section 4.1: Minimum 5 seats reserved for staff children (if applied).
- Section 7.7: 1% or minimum 1 seat for special needs (if building accessible).
- If reserved quota applicants < reserved seats, redistribute to general proximity.

### 4.5 Appeals Workflow (Section 9)

```
[Parent Files Appeal] → [System Locks Application] → [Zonal Officer Review] 
→ [Re-evaluation if needed] → [Decision] → [Update Marks/Status if Accepted]
```

**Logic:**
1. **Filing Window:** Appeals must be filed within 14 days of list publication (Section 9.2).
2. **Grounds for Appeal:**
   - Distance calculation error (Section 9.1.1)
   - Document wrongly rejected (Section 9.1.2)
   - Category eligibility dispute (Section 9.1.3)
   - Marking arithmetic error (Section 9.1.4)
3. **Re-evaluation:**
   - If distance dispute: Officer visits residence or uses alternative map source.
   - If document dispute: Senior officer reviews.
   - If marking error: Recalculate using stored formula.
4. **Decision Impact:**
   - If marks increase: Re-rank and potentially bump another applicant to waiting list.
   - If fraud detected in appeal: Blacklist applicant (Section 11.6).
5. **Notification:** SMS + Email + Portal update.

### 4.6 Final Admission Confirmation

```python
# After appeals closed (Section 8.2)
for admission in main_list:
    if admission.appeal_result != 'Rejected':
        admission.status = 'Admitted'

        # Generate admission letter PDF
        generate_letter(admission)

        # Send notification
        notify_parent(admission.guardian_id, "ADMITTED")

        # Update school roll
        increment_school_roll(admission.school_id)

# Waiting list promotion (Section 8.3)
def promote_from_waiting_list(school_id):
    # If main list candidate withdraws
    vacant_slots = count_withdrawals(school_id)

    waiting = get_waiting_list(school_id, order_by='position')
    for i in range(vacant_slots):
        if waiting[i]:
            promote_to_main(waiting[i])
            notify_parent(waiting[i].guardian_id, "PROMOTED_FROM_WAITING")
```

### 4.7 Fraud & Malpractice Handling (Section 11)

**Detection Triggers:**
- Same NIC applied for multiple children with different details.
- Address coordinates cluster suspiciously (multiple families at same GPS point).
- Document metadata mismatch (photo taken date vs claimed date).
- Staff employment verified as false with payroll database.

**Actions:**
1. **Flag:** Application marked `Flagged`, officer investigates.
2. **Confirm Fraud:** 
   - Application rejected.
   - Guardian blacklisted for 3 years.
   - Audit log entry created.
   - Section 11.7: Legal action recommended if criminal forgery.
3. **False Accusation:** If accusation is malicious, accuser blacklisted.

---

## 5. Key Constraints & Indexes

### 5.1 Constraints
```sql
-- Prevent duplicate applications
ALTER TABLE applications ADD CONSTRAINT 
    uq_app_child_school_year UNIQUE (child_id, school_id, applied_year);

-- Ensure marks don't exceed category maximums
ALTER TABLE marks_breakdown ADD CONSTRAINT 
    chk_raw_marks CHECK (raw_marks <= max_raw_marks);

-- Age validation trigger (Section 4.1)
CREATE TRIGGER trg_check_age BEFORE INSERT ON applications
FOR EACH ROW EXECUTE FUNCTION validate_age();

-- Staff must belong to applied school for 25% category
ALTER TABLE applications ADD CONSTRAINT 
    chk_staff_school CHECK (
        (staff_category = TRUE AND staff_school_id = school_id) OR 
        staff_category = FALSE
    );
```

### 5.2 Performance Indexes
```sql
CREATE INDEX idx_app_school_year ON applications(school_id, applied_year, status);
CREATE INDEX idx_app_marks ON applications(total_marks DESC) WHERE status = 'Marked';
CREATE INDEX idx_app_rank ON applications(school_id, applied_year, rank_number);
CREATE INDEX idx_docs_app ON documents(application_id, verification_status);
CREATE INDEX idx_appeals_status ON appeals(status, reviewed_at);
CREATE INDEX idx_audit ON audit_logs(table_name, record_id, performed_at);
```

---

## 6. Reporting & Transparency

### 6.1 Public Dashboard Queries
- **School-wise Statistics:** Total applied, selected, waiting, rejected.
- **Category Distribution:** How many selected per category (Staff/Sibling/etc.).
- **Distance Analysis:** Average distance of selected students.
- **Appeal Statistics:** Filed, accepted, rejected counts.

### 6.2 Audit Reports
- **Mark Recalculation Log:** Any manual mark changes must be logged with reason.
- **Document Verification Log:** Who verified what and when.
- **List Modification Log:** Any post-publication changes with judicial approval.

---

## 7. Data Retention (Implied)

- **Active Year Data:** Full CRUD access during admission cycle.
- **Post-Admission:** Archive to read-only after 1 year.
- **Legal Requirement:** Retain for 7 years for audit/compliance (Section 10.2).
- **Anonymization:** Personal identifiers hashed after 7 years for statistical use.

---

*Document generated based on the current admission circular - Grade 1 Admissions System*
*Ministry of Education, Sri Lanka*
