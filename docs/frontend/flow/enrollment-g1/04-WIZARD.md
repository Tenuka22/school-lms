# Imperative Application Wizard

## Route
`/_authenticated/student-management/enrollment/g1/$enrollment_id`
> File: `apps/web/src/components/enrollment/g1/wizard/wizard-shell.tsx`

---

## Imperative Rules

1. **Wizard is the only path** to fill enrollment data. No standalone edit dialogs.
2. **Steps are sequential and locked.** Step N cannot be accessed until Steps 1..N-1 are saved.
3. **Once COMPLETED, wizard is read-only.** Re-opening shows a locked confirmation screen.
4. **No manual status changes.** Status transitions happen only via pipeline actions (wizard completion, mark calculation).
5. **School is hardcoded.** `SEEDED_SCHOOL_ID = "00000000-0000-0000-0000-000000000001"` — multi-school support is not yet implemented.

---

## 6-Step Wizard Flow

| Step | Component | Purpose |
|------|-----------|---------|
| 1 — Child | `WizardStepChild` | Full name, initials, DOB, gender, nationality, religion, birth cert, medium, category, overseas arrival |
| 2 — Guardian | `WizardStepGuardian` | Select guardians from existing guardian master records |
| 3 — Address | `WizardStepAddress` | Select addresses from existing address records (Permanent type, Owned/Rented residence type, is_primary flag) |
| 4 — Siblings | `WizardStepSiblings` | Select sibling students from existing student records |
| 5 — Documents | `WizardStepDocuments` | Upload documents via drop zone (MinIO storage) |
| 6 — Review & Lock | `WizardStepReview` | Final review; locks the enrollment |

> Note: The design docs describe a 7-step wizard with a School Selection step. The current implementation has 6 steps and does **not** include a school selection step.

---

## Step Progress Bar (Locked)

```
┌──────────────────────────────────────────────────────────────────┐
│  ① Child     ② Guardian    ③ Address    ④ Siblings  ⑤ Documents│
│    ✓ ───────────  ✓ ────────────  ⬤ ────────────  ○ ──── ○    │
│                   ⑥ Review & Lock                                 │
│                    ○                                               │
└──────────────────────────────────────────────────────────────────┘
```

- Current step: active dot (blue ring).
- Completed: green checkmark.
- Future: gray dashed cross.
- Users can only click on completed steps or the next available step (`savedSteps + 1`).

---

## Step 1: Child Profile

### Fields

| Field | Component | Notes |
|-------|-----------|-------|
| Full Name | `Input` | Required |
| Name with Initials | `Input` | Required |
| Date of Birth | `Calendar` + `Popover` | Required |
| Gender | `Select` | Male / Female |
| Religion | `Select` | Optional |
| Nationality | `Select` | SriLankan / DualCitizen / Other |
| Birth Certificate No | `Input` | Optional |
| Medium of Instruction | `Select` | Sinhala / Tamil |
| Category | `Select` | 7 options |
| Overseas Arrival Date | `Input` | Optional |

### Default Values

```ts
gender: "Male"
nationality: "SriLankan"
medium_of_instruction: "Sinhala"
category: ""
```

### Auto-Save

On save, calls `updateApplication` mutation with all child fields plus `wizard_step: 1`.

---

## Step 2: Guardian

### Behavior

- Loads all existing guardians from `listGuardiansOptions`.
- Shows a selector where users pick guardians from the master list.
- Selected guardian IDs are saved via `saveGuardiansMutation`.

### Data Saved

```ts
body: { guardian_ids: string[] }
```

---

## Step 3: Address

### Behavior

- Loads all existing addresses from `listAddressesOptions`.
- Shows a selector where users pick addresses from the master list.
- Each selected address gets: `address_type: "Permanent"`, `residence_type: "Owned"` (default), `is_primary` flag.

### Data Saved

```ts
body: { addresses: Array<{ address_id, address_type, residence_type, is_primary }> }
```

---

## Step 4: Siblings

### Behavior

- Shows a selector where users pick sibling students from existing students.
- Selected sibling IDs are saved via `saveSiblingsMutation`.

### Data Saved

```ts
body: { student_ids: string[] }
```

---

## Step 5: Documents

### Behavior

- Shows document upload cards with drop zones.
- Documents are uploaded to MinIO and tracked locally with `status: "uploaded"`.
- On save, only documents with `status === "uploaded"` and `file_key` are sent to the server.

### Data Saved

```ts
body: {
  documents: Array<{
    doc_type: string
    file_url: string
    file_key: string
    content_type: string | null
    file_size: bigint | null
  }>
}
```

---

## Step 6: Review & Lock

### Layout

Read-only summary of all entered data:
- Child details
- Selected guardians (with names)
- Selected addresses (with types)
- Selected siblings (with names)
- Uploaded documents (with file names)
- School info (hardcoded: "St. Aloysius College, Galle")

### School Info (Hardcoded)

```ts
school: {
  school_id: SEEDED_SCHOOL_ID,  // "00000000-0000-0000-0000-000000000001"
  school_name_si: "St. Aloysius College, Galle",
  school_type: "1AB",
  category: "Urban",
  quota: 100,
}
```

### Lock Action

"Complete Enrollment" button → sets:
- `enrollment_status: "Completed"`
- `wizard_step: 6`
- Shows confirmation screen with enrollment details.

### After Completion

The wizard shows a locked screen with:
- Green checkmark + "Enrollment Locked"
- Submission summary (name, reference no, status, year)
- "Back to Pipeline" button

---

## Wizard State Management

All state is managed in `wizard-shell.tsx` via React `useState` hooks. No global store or context. Data is persisted to the server after each step via dedicated mutations.

### Key Mutations

| Mutation | Trigger | Purpose |
|----------|---------|---------|
| `updateApplication` | Child step auto-save, completion | Updates application fields |
| `saveWizardStepMutation` | Any step completion | Updates `wizard_step` counter |
| `saveGuardiansMutation` | Guardian step save | Links guardian IDs to application |
| `saveAddressesMutation` | Address step save | Links address entries to application |
| `saveSiblingsMutation` | Siblings step save | Links sibling student IDs to application |
| `saveApplicationDocumentsMutation` | Documents step save | Links document records to application |
