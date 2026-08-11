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
} from "@/lib/api-client/types.gen"
import { FieldWithAlert } from "@/components/enrollment/g1/field-with-alert"

export type ChildFormValues = {
  full_name: string
  name_with_initials: string
  name_with_initials_en?: string
  date_of_birth: string
  gender: Gender | ""
  nationality: Nationality | ""
  religion: Religion | ""
  birth_certificate_number: string
  nic: string
  passport_number: string
  medium_of_instruction: MediumOfInstruction | ""
}

export const childFormDefaults: ChildFormValues = {
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

export interface ChildFormOptions {
  excludeChildId?: string | null
  useSchemaOptions?: boolean
  includeEnglishInitials?: boolean
  includeNicAndPassport?: boolean
  layout?: "wizard" | "standalone"
}

export function makeChildFormConfig(
  options?: ChildFormOptions
): FormConfig<ChildFormValues> {
  const {
    excludeChildId,
    useSchemaOptions = false,
    includeEnglishInitials = false,
    includeNicAndPassport = true,
    layout = "standalone",
  } = options ?? {}

  const genderOptions = useSchemaOptions
    ? optionsFromSchema(GenderSchema)
    : [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
      ]

  const nationalityOptions = useSchemaOptions
    ? optionsFromSchema(NationalitySchema)
    : [
        { value: "SriLankan", label: "Sri Lankan" },
        { value: "DualCitizen", label: "Dual Citizen" },
        { value: "Other", label: "Other" },
      ]

  const religionOptions = useSchemaOptions
    ? optionsFromSchema(ReligionSchema)
    : [
        { value: "Buddhism", label: "Buddhism" },
        { value: "Hinduism", label: "Hinduism" },
        { value: "Islam", label: "Islam" },
        { value: "Christianity", label: "Christianity" },
        { value: "Catholicism", label: "Catholicism" },
        { value: "Other", label: "Other" },
      ]

  const mediumOptions = useSchemaOptions
    ? optionsFromSchema(MediumOfInstructionSchema)
    : [
        { value: "Sinhala", label: "Sinhala" },
        { value: "Tamil", label: "Tamil" },
      ]

  const fields: FormConfig<ChildFormValues>["fields"] = [
    {
      name: "full_name",
      kind: "custom",
      label: "Full Name",
      required: true,
      customRenderer: () => (
        <FieldWithAlert
          fieldName="full_name"
          placeholder="Enter full name"
          checkType="full_name"
          excludeChildId={excludeChildId}
        />
      ),
    },
    {
      name: "name_with_initials",
      kind: "text",
      label: "Name with Initials",
      placeholder: "e.g. J. M. Perera",
    },
  ]

  if (includeEnglishInitials) {
    fields.push({
      name: "name_with_initials_en" as any,
      kind: "text",
      label: "Name with Initials (English)",
      placeholder: "e.g. B.S.S. Peiris",
    } as any)
  }

  fields.push(
    { name: "date_of_birth", kind: "date", label: "Date of Birth" },
    {
      name: "gender",
      kind: "select",
      label: "Gender",
      required: true,
      options: genderOptions,
      inputProps: { placeholder: "Select gender" },
    },
    {
      name: "nationality",
      kind: "select",
      label: "Nationality",
      required: true,
      options: nationalityOptions,
      inputProps: { placeholder: "Select nationality" },
    },
    {
      name: "religion",
      kind: "select",
      label: "Religion",
      required: true,
      options: religionOptions,
      inputProps: { placeholder: "Select religion" },
    },
    {
      name: "birth_certificate_number",
      kind: "custom",
      label: "Birth Certificate Number",
      required: true,
      customRenderer: () => (
        <FieldWithAlert
          fieldName="birth_certificate_number"
          placeholder="Enter birth certificate number"
          checkType="birth_certificate_number"
          excludeChildId={excludeChildId}
        />
      ),
    }
  )

  if (includeNicAndPassport) {
    fields.push(
      {
        name: "nic",
        kind: "custom",
        label: "NIC Number",
        customRenderer: () => (
          <FieldWithAlert
            fieldName="nic"
            placeholder="Optional (for older children)"
            checkType="nic"
            excludeChildId={excludeChildId}
          />
        ),
      },
      {
        name: "passport_number",
        kind: "text",
        label: "Passport Number",
        placeholder: "Optional (for overseas arrivals)",
      }
    )
  }

  fields.push({
    name: "medium_of_instruction",
    kind: "select",
    label: "Medium of Instruction",
    required: true,
    options: mediumOptions,
    inputProps: { placeholder: "Select medium" },
  })

  if (layout === "wizard") {
    const nameFields = includeEnglishInitials
      ? ["full_name", "name_with_initials"]
      : ["full_name", "name_with_initials"]

    return {
      fields,
      layout: [
        { columns: [{ fields: nameFields }] },
        ...(includeEnglishInitials
          ? [{ columns: [{ fields: ["name_with_initials_en"] }] }]
          : []),
        { columns: [{ fields: ["date_of_birth"] }] },
        {
          columns: [
            { fields: ["gender"], span: 4 },
            { fields: ["nationality"], span: 4 },
            { fields: ["religion"], span: 4 },
          ],
        },
        { columns: [{ fields: ["birth_certificate_number"] }] },
        { columns: [{ fields: ["medium_of_instruction"] }] },
      ],
    }
  }

  return {
    fields,
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
}
