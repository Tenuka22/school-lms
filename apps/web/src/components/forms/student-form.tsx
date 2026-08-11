"use client"

import type { FormConfig } from "@/lib/form-builder"
import type {
  Gender,
  MediumOfInstruction,
  Nationality,
  Religion,
} from "@/lib/api-client/types.gen"

export type StudentFormValues = {
  full_name: string
  name_with_initials: string
  date_of_birth: string
  gender: Gender | ""
  nationality: Nationality | ""
  religion: Religion | ""
  birth_certificate_number: string
  nic: string
  passport_number: string
  medium_of_instruction: MediumOfInstruction | ""
}

export const studentFormDefaults: StudentFormValues = {
  full_name: "",
  name_with_initials: "",
  date_of_birth: "",
  gender: "Male",
  nationality: "SriLankan",
  religion: "Buddhism",
  birth_certificate_number: "",
  nic: "",
  passport_number: "",
  medium_of_instruction: "Sinhala",
}

export const studentFormConfig: FormConfig<StudentFormValues> = {
  fields: [
    {
      name: "full_name",
      kind: "text",
      label: "Full Name",
      required: true,
      placeholder: "Enter full name",
    },
    {
      name: "name_with_initials",
      kind: "text",
      label: "Name with Initials",
      required: true,
      placeholder: "e.g. J. M. Perera",
    },
    {
      name: "date_of_birth",
      kind: "date",
      label: "Date of Birth",
      required: true,
    },
    {
      name: "gender",
      kind: "select",
      label: "Gender",
      required: true,
      options: [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
      ],
      inputProps: { placeholder: "Select gender" },
    },
    {
      name: "nationality",
      kind: "select",
      label: "Nationality",
      required: true,
      options: [
        { value: "SriLankan", label: "Sri Lankan" },
        { value: "DualCitizen", label: "Dual Citizen" },
        { value: "Other", label: "Other" },
      ],
      inputProps: { placeholder: "Select nationality" },
    },
    {
      name: "religion",
      kind: "select",
      label: "Religion",
      options: [
        { value: "Buddhism", label: "Buddhism" },
        { value: "Hinduism", label: "Hinduism" },
        { value: "Islam", label: "Islam" },
        { value: "Christianity", label: "Christianity" },
        { value: "Catholicism", label: "Catholicism" },
        { value: "Other", label: "Other" },
      ],
      inputProps: { placeholder: "Select religion" },
    },
    {
      name: "birth_certificate_number",
      kind: "text",
      label: "Birth Certificate Number",
      placeholder: "Enter birth certificate number",
    },
    {
      name: "nic",
      kind: "text",
      label: "NIC Number",
      placeholder: "Optional (for older children)",
    },
    {
      name: "passport_number",
      kind: "text",
      label: "Passport Number",
      placeholder: "Optional (for overseas arrivals)",
    },
    {
      name: "medium_of_instruction",
      kind: "select",
      label: "Medium of Instruction",
      required: true,
      options: [
        { value: "Sinhala", label: "Sinhala" },
        { value: "Tamil", label: "Tamil" },
      ],
      inputProps: { placeholder: "Select medium" },
    },
  ],
  layout: [
    { columns: [{ fields: ["full_name"] }] },
    { columns: [{ fields: ["name_with_initials"] }] },
    { columns: [{ fields: ["date_of_birth"] }] },
    {
      columns: [
        { fields: ["gender"], span: 4 },
        { fields: ["nationality"], span: 4 },
        { fields: ["religion"], span: 4 },
      ],
    },
    { columns: [{ fields: ["birth_certificate_number"] }] },
    { columns: [{ fields: ["nic"] }] },
    { columns: [{ fields: ["passport_number"] }] },
    { columns: [{ fields: ["medium_of_instruction"] }] },
  ],
}
