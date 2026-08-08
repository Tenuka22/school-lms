"use client"

import type { FormConfig } from "@/lib/form-builder"
import {
  RELATIONSHIP_OPTIONS,
  CATEGORY_INFO,
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
}

export const guardianFormConfig: FormConfig<GuardianFormValues> = {
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
    { name: "full_name", kind: "text", label: "Full Name", required: true, section: "step1", placeholder: "e.g. John Doe" },
    { name: "nic_number", kind: "text", label: "NIC Number", required: true, section: "step1", placeholder: "e.g. 952312345V" },
    { name: "contact_phone", kind: "text", label: "Phone Number", required: true, section: "step1", placeholder: "e.g. +94 77 123 4567" },
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
      customRenderer: () => null,
    },
    {
      name: "workplace_name",
      kind: "custom",
      label: "Workspace",
      section: "step1",
      customRenderer: () => null,
    },
    { name: "workplace_address", kind: "text", label: "", hidden: true },
    ...CATEGORY_INFO.map((cat) => ({
      name: cat.key,
      kind: "custom" as const,
      label: cat.label,
      section: "step2",
      customRenderer: () => null,
    })),
    {
      name: "income_level",
      kind: "select",
      label: "Monthly Income (LKR)",
      section: "step2",
      options: [
        { value: "below_25000", label: "Below 25,000" },
        { value: "25000_50000", label: "25,000 – 50,000" },
        { value: "50000_100000", label: "50,000 – 100,000" },
        { value: "100000_200000", label: "100,000 – 200,000" },
        { value: "200000_500000", label: "200,000 – 500,000" },
        { value: "above_500000", label: "Above 500,000" },
      ],
      inputProps: { placeholder: "Select income range (optional)" },
    },
  ],
  layout: [
    { columns: [{ fields: ["relationship_type"], span: 12 }] },
    { columns: [{ fields: ["full_name"], span: 12 }] },
    { columns: [{ fields: ["nic_number"], span: 6 }, { fields: ["contact_phone"], span: 6 }] },
    { columns: [{ fields: ["contact_email"], span: 6 }, { fields: ["occupation"], span: 6 }] },
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
