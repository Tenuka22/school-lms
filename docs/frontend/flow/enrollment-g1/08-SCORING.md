# G1 Scoring & Marks Management

## Route
`/_authenticated/student-management/enrollment/g1/scoring/$enrollment_id`
> File: `apps/web/src/routes/_authenticated/student-management/enrollment/g1/scoring.$enrollment_id.tsx`
> Component: `apps/web/src/components/enrollment/g1/scoring/scoring-dashboard.tsx`

---

## Purpose

This page displays the **6 scoring categories** for a G1 application, their computed scores, and allows triggering mark calculation.

---

## The 6 Scoring Categories

| Category | Code | Weight | Description |
|----------|------|--------|-------------|
| Proximity | PROX | 50% | Distance from residence to school |
| School Staff Child | STAFF | 25% | Parent employed as staff at this school |
| Sibling in School | SIBLING | 14% | Sibling currently enrolled at this school |
| Past Pupil Child | ALUMNI | 6% | Parent is a past pupil of this school |
| Government Employee | GOVT | 4% | Parent is a government employee |
| Special Circumstances | SPECIAL | 1% | Disability, low income, or special needs |

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Scoring & Marks                                              │
│  Nimal Perera · G1-2027-00042                    [Calculate Marks]│
├──────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ 🏆 Best Performing Category: Proximity                     │   │
│ │    Weight: 50% · Estimated: 25.00 pts         Total: 92.50│   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │Proximity │ │Staff     │ │Sibling   │ │Alumni    │ │Govt      ││
│ │ 50%      │ │ 25%      │ │ 14%      │ │ 6%       │ │ 4%       ││
│ │ Raw: 50  │ │ Raw: 100 │ │ NR       │ │ Raw: 100 │ │ NR       ││
│ │ Wtd: 25  │ │ Wtd: 25  │ │          │ │ Wtd: 6   │ │          ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│ ┌──────────┐                                                     │
│ │Special   │                                                     │
│ │ 1%       │                                                     │
│ │ NR       │                                                     │
│ └──────────┘                                                     │
│                                                                   │
│ Distance Bands (Proximity Scoring)                                │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│ │<0.5km│ │0.5-1 │ │1-2   │ │2-3   │ │3-5   │ │>5km  │          │
│ │ 100  │ │ 80   │ │ 60   │ │ 40   │ │ 20   │ │ 10   │          │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Category Cards

Each category renders as a card showing:
1. **Category label** with color indicator
2. **Weight percentage** badge
3. **Raw score** (0-100) with progress bar — shown only when data is available
4. **Weighted score** (raw_score × weight / 100)
5. If no data: "No data provided for this category" with reduced opacity

---

## Best Category Indicator

When marks exist, the highest-contributing category is highlighted in a green banner at the top with a trophy icon. This shows which category gives the applicant the best admission advantage.

---

## Calculate Marks Action

The "Calculate Marks" button calls the backend endpoint, which:
1. Queries all join tables for the application
2. Computes raw and weighted scores per category
3. Stores results in `marks_breakdown` table
4. Sets `total_marks` on the application
5. Changes `enrollment_status` from `Completed` to `PendingApproval`

---

## Distance Bands Reference

A consistent reference table at the bottom shows the 6 distance bands used for proximity scoring.

| Distance | Raw Marks |
|----------|-----------|
| < 0.5 km | 100 |
| 0.5 - 1 km | 80 |
| 1 - 2 km | 60 |
| 2 - 3 km | 40 |
| 3 - 5 km | 20 |
| > 5 km | 10 |

