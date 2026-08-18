"use client"

import type { FormConfig } from "@/lib/form-builder"
import { optionsFromSchema } from "@/lib/form-builder"
import {
  GenderSchema,
  NationalitySchema,
  ReligionSchema,
  MediumOfInstructionSchema,
} from "@/lib/api-client/schemas.gen"
import type {
  Gender,
  MediumOfInstruction,
  Nationality,
  Religion,
  StudentResponse as Student,
  UpdateStudentRequest,
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

export type StudentEditFormValues = UpdateStudentRequest

export function buildStudentEditDefaults(
  student: Student
): StudentEditFormValues {
  return {
    full_name: student.full_name,
    name_with_initials: student.name_with_initials,
    date_of_birth: student.date_of_birth,
    gender: student.gender,
    nationality: student.nationality,
    religion: student.religion ?? null,
    medium_of_instruction: student.medium_of_instruction,
    birth_certificate_number: student.birth_certificate_number ?? null,
    nic: student.nic ?? null,
    passport_number: student.passport_number ?? null,
    phone: student.phone ?? null,
    email: student.email ?? null,
    current_grade: student.current_grade ?? null,
  }
}

export function buildStudentEditConfig(): FormConfig<StudentEditFormValues> {
  return {
    fields: [
      { name: "full_name", kind: "text", label: "Full Name", required: true },
      {
        name: "name_with_initials",
        kind: "text",
        label: "Name with Initials",
        required: true,
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
        options: optionsFromSchema(GenderSchema),
      },
      {
        name: "nationality",
        kind: "select",
        label: "Nationality",
        required: true,
        options: optionsFromSchema(NationalitySchema),
      },
      {
        name: "religion",
        kind: "select",
        label: "Religion",
        required: true,
        options: optionsFromSchema(ReligionSchema),
      },
      {
        name: "medium_of_instruction",
        kind: "select",
        label: "Medium",
        required: true,
        options: optionsFromSchema(MediumOfInstructionSchema),
      },
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
  }
}
