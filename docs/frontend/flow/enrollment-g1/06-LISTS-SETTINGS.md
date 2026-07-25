# Admission Lists & Settings

> **NOT YET IMPLEMENTED** — These pages and features are planned but not built.

## Planned Routes

- `/student-management/enrollment/g1/lists` — Final admission lists
- `/student-management/enrollment/g1/settings` — Configuration

---

## Planned Admission Lists

### Data Source
`admission_lists` table — populated after marks calculation and approval. Each entry links an application to a school with list_type (MainList/WaitingList/RejectedList) and position_number.

### Planned Features

- Quota visualization bar (4 segments: General, Staff, Distance, SpecialNeeds)
- Three tabbed data tables (Main List, Waiting List, Rejected)
- Export to PDF/Excel
- Quota validation (minimum 35 seats per school)

---

## Planned Settings Page

### Access
Admin only. All setting changes logged to audit.

### Planned Sections

- **School Quotas** — seat allocation per school
- **Scoring Weights** — 6 weights that must sum to 100% (Proximity 50, Staff 25, Sibling 14, Alumni 6, Govt 4, Special 1)
- **Distance Bands** — proximity scoring bands (<0.5km=100, 0.5-1km=80, 1-2km=60, 2-3km=40, 3-5km=20, >5km=10)
- **Reserved Minimums** — minimum seats for Staff, SpecialNeeds categories
- **Time Windows** — application dates, doc re-submission days, appeal days
