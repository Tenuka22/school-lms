"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxInput,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import professions from "professions"
import type { FormConfig } from "@/lib/form-builder"
import {
  RELATIONSHIP_OPTIONS,
  CATEGORY_INFO,
  SchoolCombobox,
  StudentCombobox,
  WorkspaceAddressSelect,
} from "@/components/enrollment/g1/wizard/guardian-helpers"

export type GuardianFormValues = Record<string, unknown>

export const guardianFormDefaults: GuardianFormValues = {
  full_name: "",
  nic_number: "",
  contact_phone: "",
  contact_email: null,
  occupation: null,
  workplace_name: null,
  workplace_address: null,
  relationship_type: "Guardian",
  is_school_staff: false,
  staff_type: null,
  employee_id: null,
  staff_school_id: null,
  is_past_pupil: false,
  is_govt_employee: false,
  income_level: null,
  govt_service_years: null,
  past_pupil_student_id: null,
  past_pupil_highest_grade: null,
  past_pupil_year_left: null,
  past_pupil_left_reason: null,
  past_pupil_school_id: null,
  student_id: null,
}

export const INCOME_LEVEL_OPTIONS = [
  { value: "below_25000", label: "Below 25,000" },
  { value: "25000_50000", label: "25,000 – 50,000" },
  { value: "50000_100000", label: "50,000 – 100,000" },
  { value: "100000_200000", label: "100,000 – 200,000" },
  { value: "200000_500000", label: "200,000 – 500,000" },
  { value: "above_500000", label: "Above 500,000" },
]

function OccupationRenderer({
  value,
  onChange,
}: {
  value: unknown
  onChange: (v: unknown) => void
}) {
  return (
    <Combobox
      items={professions}
      value={String(value ?? "")}
      onValueChange={(v) => onChange(v || null)}
    >
      <ComboboxInput placeholder="Search or type occupation..." showClear />
      <ComboboxContent>
        <ComboboxEmpty>No matching title. Type your own.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function WorkplaceRenderer({
  setFieldValue,
}: {
  setFieldValue: (name: string, value: unknown) => void
}) {
  return (
    <WorkspaceAddressSelect
      onChange={(name, address) => {
        setFieldValue("workplace_name", name)
        setFieldValue("workplace_address", address)
      }}
    />
  )
}

function CategoryRenderer({
  cat,
  value,
  onChange,
  formValues,
  setFieldValue,
}: {
  cat: (typeof CATEGORY_INFO)[number]
  value: unknown
  onChange: (v: unknown) => void
  formValues: Record<string, unknown>
  setFieldValue: (name: string, value: unknown) => void
}) {
  const checked = !!value
  return (
    <div
      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
        checked
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-accent/50"
      }`}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (
          target.closest(
            '[role="option"], [role="combobox"], [role="listbox"], input, select, button'
          )
        )
          return
        onChange(!checked)
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => onChange(v === true)}
          />
          <span className="text-sm font-medium">{cat.label}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          +{cat.weight}
        </Badge>
      </div>
      <p className="mt-1 ml-7 text-xs text-muted-foreground">{cat.desc}</p>
      {cat.key === "is_school_staff" && checked && (
        <div className="mt-2 ml-7 space-y-2">
          <SchoolCombobox
            value={formValues.staff_school_id as string | null}
            onChange={(v) => setFieldValue("staff_school_id", v)}
          />
          <Select
            value={String(formValues.staff_type ?? "")}
            onValueChange={(v) => setFieldValue("staff_type", v || null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Staff type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Teacher">Teacher</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Worker">Worker</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Employee ID (optional)"
            value={String(formValues.employee_id ?? "")}
            onChange={(e) =>
              setFieldValue("employee_id", e.target.value || null)
            }
          />
          <Input
            placeholder="Designation (optional)"
            value={String(formValues.occupation ?? "")}
            onChange={(e) =>
              setFieldValue("occupation", e.target.value || null)
            }
          />
        </div>
      )}
      {cat.key === "is_govt_employee" && checked && (
        <div className="mt-2 ml-7">
          <Input
            placeholder="Years of government service"
            type="number"
            value={String(formValues.govt_service_years ?? "")}
            onChange={(e) =>
              setFieldValue(
                "govt_service_years",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        </div>
      )}
      {cat.key === "is_past_pupil" && checked && (
        <div className="mt-2 ml-7 space-y-2">
          <SchoolCombobox
            value={formValues.past_pupil_school_id as string | null}
            onChange={(v) => setFieldValue("past_pupil_school_id", v)}
          />
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Past pupil record at school
            </label>
            <StudentCombobox
              value={formValues.past_pupil_student_id as string | null}
              onChange={(v) => setFieldValue("past_pupil_student_id", v)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Link to student record (optional)
            </label>
            <StudentCombobox
              value={formValues.student_id as string | null}
              onChange={(v) => setFieldValue("student_id", v)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={String(formValues.past_pupil_highest_grade ?? "")}
              onValueChange={(v) =>
                setFieldValue("past_pupil_highest_grade", v || null)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Highest grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GCE_AL">GCE A/L</SelectItem>
                <SelectItem value="GCE_OL">GCE O/L</SelectItem>
                <SelectItem value="Grade_11">Grade 11</SelectItem>
                <SelectItem value="Grade_10">Grade 10</SelectItem>
                <SelectItem value="Below_Grade_10">Below Grade 10</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={String(formValues.past_pupil_left_reason ?? "")}
              onValueChange={(v) =>
                setFieldValue("past_pupil_left_reason", v || null)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Transferred">Transferred</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Year left school (e.g. 2015)"
            type="number"
            value={String(formValues.past_pupil_year_left ?? "")}
            onChange={(e) =>
              setFieldValue(
                "past_pupil_year_left",
                e.target.value ? Number(e.target.value) : null
              )
            }
          />
        </div>
      )}
    </div>
  )
}

export interface GuardianFormOptions {
  contactPhoneRequired?: boolean
}

export function makeGuardianFormConfig(
  options?: GuardianFormOptions
): FormConfig<GuardianFormValues> {
  const phoneRequired = options?.contactPhoneRequired ?? false

  return {
    fields: [
      {
        name: "relationship_type",
        kind: "select",
        label: "Relationship",
        required: true,
        options: RELATIONSHIP_OPTIONS.map((r) => ({ value: r, label: r })),
        section: "step1",
        inputProps: { placeholder: "Select relationship" },
      },
      {
        name: "full_name",
        kind: "text",
        label: "Full Name",
        required: true,
        section: "step1",
        placeholder: "e.g. John Doe",
      },
      {
        name: "nic_number",
        kind: "text",
        label: "NIC Number",
        required: true,
        section: "step1",
        placeholder: "e.g. 952312345V",
      },
      {
        name: "contact_phone",
        kind: "text",
        label: "Phone Number",
        required: phoneRequired,
        section: "step1",
        placeholder: "e.g. +94 77 123 4567",
      },
      {
        name: "contact_email",
        kind: "text",
        label: "Email Address",
        section: "step1",
        placeholder: "e.g. john@example.com",
        inputProps: { type: "email" },
      },
      {
        name: "occupation",
        kind: "custom",
        label: "Occupation",
        section: "step1",
        customRenderer: ({ value, onChange }) => (
          <OccupationRenderer value={value} onChange={onChange} />
        ),
      },
      {
        name: "workplace_name",
        kind: "custom",
        label: "Workspace",
        section: "step1",
        customRenderer: ({ setFieldValue }) => (
          <WorkplaceRenderer setFieldValue={setFieldValue} />
        ),
      },
      { name: "workplace_address", kind: "text", label: "", hidden: true },
      ...CATEGORY_INFO.map((cat) => ({
        name: cat.key,
        kind: "custom" as const,
        label: cat.label,
        section: "step2",
        customRenderer: ({
          value,
          onChange,
          formValues,
          setFieldValue,
        }: any) => (
          <CategoryRenderer
            cat={cat}
            value={value}
            onChange={onChange}
            formValues={formValues}
            setFieldValue={setFieldValue}
          />
        ),
      })),
      {
        name: "income_level",
        kind: "select",
        label: "Monthly Income (LKR)",
        section: "step2",
        options: INCOME_LEVEL_OPTIONS,
        inputProps: { placeholder: "Select income range (optional)" },
      },
    ],
    layout: [
      { columns: [{ fields: ["relationship_type"], span: 12 }] },
      { columns: [{ fields: ["full_name"], span: 12 }] },
      {
        columns: [
          { fields: ["nic_number"], span: 6 },
          { fields: ["contact_phone"], span: 6 },
        ],
      },
      {
        columns: [
          { fields: ["contact_email"], span: 6 },
          { fields: ["occupation"], span: 6 },
        ],
      },
      { columns: [{ fields: ["workplace_name"], span: 12 }] },
      { columns: [{ fields: ["is_school_staff"], span: 12 }] },
      { columns: [{ fields: ["is_past_pupil"], span: 12 }] },
      { columns: [{ fields: ["is_govt_employee"], span: 12 }] },
      { columns: [{ fields: ["income_level"], span: 12 }] },
    ],
    sections: [
      { id: "step1", title: "Guardian Details", step: 1 },
      { id: "step2", title: "Enrollment Categories", step: 2 },
    ],
  }
}
