"use client"

import type { FormConfig } from "@/lib/form-builder"
import { optionsFromSchema } from "@/lib/form-builder"
import {
  GenderSchema,
  NationalitySchema,
  ReligionSchema,
  MediumOfInstructionSchema,
} from "@/lib/api-client/schemas.gen"
import type { CreateSiblingRequest } from "@/lib/api-client/types.gen"

export type SiblingFormValues = CreateSiblingRequest

export const siblingFormDefaults: SiblingFormValues = {
  full_name: "",
  name_with_initials: "",
  date_of_birth: "",
  gender: "Male",
  nationality: "SriLankan",
  religion: null,
  medium_of_instruction: "Sinhala",
  birth_certificate_number: null,
  nic: null,
  passport_number: null,
  phone: null,
  email: null,
  current_grade: null,
  school_id: null,
}

export const siblingFormConfig: FormConfig<SiblingFormValues> = {
  fields: [
    { name: "full_name", kind: "text", label: "Full Name", required: true, placeholder: "e.g. John Doe" },
    { name: "name_with_initials", kind: "text", label: "Name with Initials", required: true, placeholder: "e.g. J. Doe" },
    { name: "date_of_birth", kind: "date", label: "Date of Birth", required: true },
    { name: "gender", kind: "select", label: "Gender", required: true, options: optionsFromSchema(GenderSchema) },
    { name: "nationality", kind: "select", label: "Nationality", required: true, options: optionsFromSchema(NationalitySchema) },
    { name: "religion", kind: "select", label: "Religion", required: true, options: optionsFromSchema(ReligionSchema) },
    { name: "medium_of_instruction", kind: "select", label: "Medium", required: true, options: optionsFromSchema(MediumOfInstructionSchema) },
    {
      name: "current_grade",
      kind: "number",
      label: "Enrollment Grade",
      placeholder: "e.g. 1",
      inputProps: { min: 1, max: 13 },
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
    {
      name: "birth_certificate_number",
      kind: "text",
      label: "Birth Certificate No",
      required: true,
      placeholder: "e.g. BC123456",
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
    {
      name: "nic",
      kind: "text",
      label: "NIC",
      placeholder: "e.g. 200012345678",
      section: "optional",
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
    {
      name: "passport_number",
      kind: "text",
      label: "Passport No",
      placeholder: "e.g. P1234567",
      section: "optional",
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
    {
      name: "phone",
      kind: "text",
      label: "Phone",
      placeholder: "e.g. +94771234567",
      section: "optional",
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
    {
      name: "email",
      kind: "text",
      label: "Email",
      placeholder: "e.g. john@example.com",
      section: "optional",
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
  ],
  layout: [
    { columns: [{ fields: ["full_name"], span: 12 }] },
    { columns: [{ fields: ["name_with_initials"], span: 12 }] },
    {
      columns: [
        { fields: ["date_of_birth"], span: 6 },
        { fields: ["gender"], span: 6 },
      ],
    },
    {
      columns: [
        { fields: ["nationality"], span: 6 },
        { fields: ["religion"], span: 6 },
      ],
    },
    {
      columns: [
        { fields: ["medium_of_instruction"], span: 6 },
        { fields: ["current_grade"], span: 6 },
      ],
    },
    { columns: [{ fields: ["birth_certificate_number"], span: 12 }] },
    {
      columns: [
        { fields: ["nic"], span: 6 },
        { fields: ["passport_number"], span: 6 },
      ],
    },
    {
      columns: [
        { fields: ["phone"], span: 6 },
        { fields: ["email"], span: 6 },
      ],
    },
  ],
  sections: [
    {
      id: "optional",
      title: "Optional Contact & ID Fields",
      collapsible: true,
    },
  ],
  submitLabel: "Create Sibling",
}
