# G1 2026 Circular - Data Requirements Analysis

**Circular Reference**: අතුණු කරුම - 25/2026 (Grade 1 Admissions to National Schools 2026)

## Circular Key Data Requirements

### 1. Child Information
- Full name (සම්පූර්ණ නම)
- Name with initials (නම මුල් අකුරු)
- Date of birth (උපන් දිනය)
- Gender (ලිංගය)
- Nationality (පුරවැසිභාවය)
- Religion (ආගම)
- Medium of instruction (අධ්‍යාපන මාධ්‍යය)
- Birth certificate number (උප්පැන්න සහතික අංකය)
- Disability status/type (ආබාධිත තත්ත්වය/වර්ගය)
- Photo (ඡායාරූපය)
- Admission number (ප්‍රවේශ අංකය)

### 2. Guardian/Parent Information
- Guardian name (ළමා හිමියාගේ නම)
- Relationship (සම්බන්ධතාවය)
- NIC number (හැඳුනුම්පත් අංකය)
- Contact phone (සම්බන්ධතා දුරකථන)
- Email (ඊමේල්)
- Occupation (රැකියාව)
- Workplace name/address (රැකියා ස්ථානය)
- Is government employee (රාජ්‍ය සේවකයෙක්ද)
- Government service years (රාජ්‍ය සේවා වර්ෂ ගණන)
- Is school staff (පාසල් සේවකයෙක්ද)
- Staff type (සේවක වර්ගය)
- Employee ID (සේවක අංකය)
- Designation (තනතුර)
- Is past-pupil (පසු ශිෂ්‍යයෙක්ද)
- Past pupil school (පසු ශිෂ්‍ය පාසල)
- Highest grade (උපරිම ශ්‍රේණිය)
- Year left (අවසන් වර්ෂය)
- Income level (ආදායම් මට්ටම)

### 3. Address Information
- Address line 1/2 (ලිපිනය පේළි 1/2)
- City (නගරය)
- District (දිස්ත්‍රික්කය)
- Province (පළාත)
- GS Division (ඉඩම් කොට්ඨාසය)
- Postal code (තැපැල් කේතය)
- Residence type (පදිංචි වර්ගය)
- Ownership proof (හිමිකම් සාක්ෂි)
- Latitude/Longitude (අක්ෂාංග/දේශාංග)
- Distance to school (පාසලට දුර)

### 4. Scoring Categories (Circular Section 7.0)
- **Proximity (50%)**: Distance-based scoring
  - < 0.5km = 100, 0.5-1km = 80, 1-2km = 60, 2-3km = 40, 3-5km = 20, > 5km = 10
- **Staff (25%)**: School staff children
  - Current staff at same school: 25 points
  - Distance adjustments apply
- **Sibling (14%)**: Current students at the school
  - Verified siblings at same school
- **Alumni (6%)**: Past pupils
  - Verified past pupils, score based on highest grade
- **Govt (4%)**: Government employees
  - Based on service years
- **Special (1%)**: Special cases
  - Income level below threshold

### 5. Required Documents (Circular Section 6.2.1)
- Birth certificate
- Guardian NIC
- Residence certificate (ස්ථිර පදිංචි සහතිකය)
- Death certificate (if applicable)
- Government documents
- Passport (for overseas arrivals)
- Staff appointment letter
- Alumni certificate
- Government employee certificate
- Income certificate
- Ownership proof

### 6. Application Categories
- General (සාමාන්‍ය)
- School Staff (පාසල් සේවක)
- Past Pupil (පසු ශිෂ්‍ය)
- Government Employee (රාජ්‍ය සේවක)
- Special Needs (විශේෂ අවශ්‍යතා)
- Overseas Arrival (විදේශ පැමිණීම)

---

## Gap Analysis: Current System vs Circular

### ✅ Fields Already Present in DB

#### Child Entity (children table)
- full_name ✅
- name_with_initials ✅
- date_of_birth ✅
- gender ✅
- nationality ✅
- religion ✅
- medium_of_instruction ✅
- birth_certificate_number ✅
- disability_status ✅
- disability_type ✅
- photo_url ✅

#### Guardian Entity (guardians table)
- relationship_type ✅
- full_name ✅
- nic_number ✅
- contact_phone ✅
- contact_email ✅
- occupation ✅
- workplace_name ✅
- workplace_address ✅
- is_govt_employee ✅
- govt_service_years ✅
- is_school_staff ✅
- is_past_pupil ✅
- income_level ✅

#### Address Entity (addresses table)
- address_line_1 ✅
- address_line_2 ✅
- city ✅
- district ✅
- province ✅
- gs_division ✅
- postal_code ✅
- latitude ✅
- longitude ✅
- distance_to_school_km ✅
- residence_type ✅
- ownership_proof ✅

#### G1 Applications (g1_applications table)
- category ✅
- overseas_arrival_date ✅
- wizard_step ✅
- submission_method ✅
- interview_date ✅
- interview_completed ✅
- verification flags ✅

#### Documents (g1_documents table)
- document_type ✅ (13 types defined)
- file_url ✅
- file_key ✅
- verification_status ✅

#### Scoring (marks_breakdown table)
- 6 categories implemented ✅
- Distance bands defined ✅

### ⚠️ Fields Missing or Incomplete

#### 1. Child Entity - Missing Fields
- **nic** field exists on `students` table but NOT on `children` table
  - Children table has: birth_certificate_number, but not NIC
  - Circular requires NIC for children too (for older children)

#### 2. Guardian Entity - Missing Fields
- **workplace_address** is a String field
  - Circular expects structured workspace address (linked to workspace_addresses table)
  - The entity has `workplace_address: Option<String>` but the system also has `workspace_addresses` table with join table
  - The frontend already has `WorkspaceAddressSelect` component

#### 3. Application Categories - May Need Expansion
Current `G1Category` enum:
- CloseResident
- PastPupilChild
- Sibling
- MOEOrUGCStaffChild
- GovernmentTransferOfficerChild
- OverseasArrival
- ArmedForcesReserved

Circular categories (from scoring sections):
- General (close resident) → CloseResident ✅
- Staff child → MOEOrUGCStaffChild ✅
- Past pupil child → PastPupilChild ✅
- Sibling → Sibling ✅
- Government employee child → GovernmentTransferOfficerChild ✅
- Overseas arrival → OverseasArrival ✅
- Armed forces → ArmedForcesReserved ✅
- Special needs → **MISSING**
- Low income family → **MISSING** (currently handled by income_level but not as separate category)

#### 4. Documents - Missing Types
Current `G1DocumentType` has 13 types. Circular requires:
- BaptismCertificate ✅
- IncomeCertificate ✅
- DisabilityCertificate ✅
- SiblingSchoolCertificate ✅
- StaffAppointmentLetter ✅
- PastPupilCertificate ✅
- GovtServiceCertificate ✅
- **Missing**: TransferLetter (for school transfers)
- **Missing**: CitizenshipCertificate (for dual citizens)
- **Missing**: MarriageCertificate (for name mismatches)

#### 5. Scoring Implementation Gaps

**Staff Category (25%)**:
- Current: Checks `join_staff_details` for current staff at same school
- Circular: Also considers distance adjustments (>100km reduces score)
- **Gap**: Distance adjustment for staff not fully implemented

**Sibling Category (14%)**:
- Current: Checks `join_siblings` for verified siblings
- Circular: Multiple sibling scoring tiers (1st sibling vs additional)
- **Gap**: No sibling count-based scoring

**Alumni Category (6%)**:
- Current: Checks `join_past_pupil_details`
- Circular: Score based on highest grade completed
- **Gap**: Highest grade not used in scoring calculation

**Govt Category (4%)**:
- Current: Checks primary guardian's `is_govt_employee` + service years
- Circular: Service years determine score
- **Gap**: Service years scoring tiers not implemented

**Special Category (1%)**:
- Current: Checks `income_level` (below 50000 adds 10 raw points)
- Circular: Multiple special needs criteria
- **Gap**: Disability status not used in scoring

#### 6. Distance Calculation
- Current: Uses haversine formula in `calculate_marks`
- Circular: Uses 1:10000 cadastral maps and Google Maps
- **Gap**: No integration with official cadastral data

#### 7. Age Eligibility
- Circular: Children must be born between 2021.05.01 and 2022.04.30 (for 2027 admission)
- **Gap**: No age eligibility validation in create/update handlers

#### 8. Waiting List Management
- Current: `waiting_list_size` field on batch (default 20)
- Circular: Detailed waiting list rules (quota + 20, priority by marks)
- **Gap**: No waiting list priority calculation

#### 9. Appeals Process
- Current: `appeal_history` table exists
- Circular: Detailed appeal procedures and scoring re-evaluation
- **Gap**: Appeal handling not fully implemented in REST API

---

## Recommendations for DB Generalization

### ✅ Completed
1. **Add NIC/passport fields to children table** — Done in migration `m20260804_000001_add_nic_passport_to_children.rs`
2. **Add SpecialNeeds/LowIncome to G1Category** — Done in `enums.rs` + frontend + API client
3. **Add religion quota fields to enrollment_batches** — Done in migration + entity + frontend
4. **NIC/passport on child forms** — Done in `wizard-step-child.tsx`, `create-child-form.tsx`, `g1-enrollment-dialog.tsx`, `sibling-form.tsx`

### ⚠️ Still Needed — Scoring Enhancements
5. **Distance duration scoring** — Proximity needs residence duration sub-component
6. **Parent birth area bonus** — +5 marks if both parents born in area
7. **Staff employment type tiers** — Permanent/Temporary/Contract scoring
8. **Staff distance adjustment** — 20% reduction if >100km from school
9. **Staff service duration bonus** — +2 marks for 10+ years
10. **Sibling age/grade priority** — +2 marks for Grade 1-5, +1 for Grade 6-10
11. **Alumni grade-based scoring** — GCE A/L = 100%, Grade 11 = 80%, etc.
12. **Alumni year-left priority** — +0.5 marks if left within 5 years
13. **Govt service year tiers** — 20+ years = 100%, 15-20 = 80%, etc.
14. **Govt transfer bonus** — +1 mark if transferred within 5 years
15. **Special needs scoring** — Disability verification adds points
16. **Armed forces bonus** — +0.5 marks for armed forces parents

### Low Priority (Advanced Features)
17. Waiting list priority calculation
18. Appeal handling automation
19. Cadastral map integration
20. Batch-configurable scoring weights (weights stored but hardcoded in calculate_marks)

---

## Priority Implementation Order

### ✅ Completed
1. ~~Add NIC/passport fields to children table~~
2. ~~Add SpecialNeeds/LowIncome to G1Category~~
3. ~~Add religion quota fields to enrollment_batches~~

### High Priority (Scoring Accuracy)
4. Distance duration scoring sub-component
5. Alumni grade-based scoring tiers
6. Govt service year tiers
7. Staff employment type tiers
8. Special needs/disability scoring

### Medium Priority (Scoring Enhancements)
9. Parent birth area bonus
10. Staff distance adjustment (>100km)
11. Staff service duration bonus
12. Sibling age/grade priority
13. Alumni year-left priority
14. Govt transfer bonus
15. Armed forces bonus

### Low Priority (Advanced Features)
16. Waiting list priority calculation
17. Appeal handling automation
18. Cadastral map integration
19. Batch-configurable scoring weights
