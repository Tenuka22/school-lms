"use client"

import type { FormConfig } from "@/lib/form-builder"
import type { CreateBatchBody } from "@/lib/api-client/types.gen"

export type BatchFormValues = CreateBatchBody

export const batchFormDefaults: BatchFormValues = {
  year: new Date().getFullYear(),
  enrollment_type: "G1",
  student_allocation: 200,
  proximity_percentage: 50,
  staff_percentage: 25,
  sibling_percentage: 14,
  alumni_percentage: 6,
  govt_percentage: 4,
  special_percentage: 1,
  buddhism_percentage: 74,
  catholicism_percentage: 12,
  islam_percentage: 14,
  hinduism_percentage: 0,
}

export const batchFormConfig: FormConfig<BatchFormValues> = {
  fields: [
    {
      name: "year",
      kind: "number",
      label: "Year",
      placeholder: "2026",
      required: true,
    },
    {
      name: "student_allocation",
      kind: "slider",
      label: "Total Seats",
      inputProps: { min: 10, max: 1000, step: 10 },
    },
  ],
  layout: [
    { columns: [{ fields: ["year"] }, { fields: ["student_allocation"] }] },
  ],
}
