"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import { FormBuilder } from "@/lib/form-builder"
import type { FormConfig } from "@/lib/form-builder"
import type { Child, Gender, MediumOfInstruction, Nationality } from "@/lib/api-client/types.gen"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import { createChild, updateChild } from "@/lib/api-client/sdk.gen"

type ChildFormValues = {
  full_name: string
  name_with_initials: string
  date_of_birth: string
  gender: Gender | ""
  nationality: Nationality | ""
  medium_of_instruction: MediumOfInstruction | ""
}

const defaultValues: ChildFormValues = {
  full_name: "",
  name_with_initials: "",
  date_of_birth: "",
  gender: "",
  nationality: "",
  medium_of_instruction: "",
}

const formConfig: FormConfig<ChildFormValues> = {
  fields: [
    { name: "full_name", kind: "text", label: "Full Name", required: true, placeholder: "Enter full name" },
    { name: "name_with_initials", kind: "text", label: "Name with Initials", placeholder: "e.g. J. M. Perera" },
    { name: "date_of_birth", kind: "date", label: "Date of Birth" },
    {
      name: "gender", kind: "select", label: "Gender",
      options: [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
      ],
      inputProps: { placeholder: "Select gender" },
    },
    {
      name: "nationality", kind: "select", label: "Nationality",
      options: [
        { value: "SriLankan", label: "Sri Lankan" },
        { value: "DualCitizen", label: "Dual Citizen" },
        { value: "Other", label: "Other" },
      ],
      inputProps: { placeholder: "Select nationality" },
    },
    {
      name: "medium_of_instruction", kind: "select", label: "Medium of Instruction",
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
    { columns: [{ fields: ["gender"], span: 6 }, { fields: ["nationality"], span: 6 }] },
    { columns: [{ fields: ["medium_of_instruction"] }] },
  ],
}

export function CreateChildForm({
  child,
  onSuccess,
}: {
  child?: Child | null
  onSuccess: (child: Child) => void
}) {
  const [saving, setSaving] = useState(false)

  return (
    <FormBuilder<ChildFormValues>
      config={formConfig}
      defaultValues={child ? {
        full_name: child.full_name ?? "",
        name_with_initials: child.name_with_initials ?? "",
        date_of_birth: child.date_of_birth ?? "",
        gender: (child.gender ?? "") as Gender | "",
        nationality: (child.nationality ?? "") as Nationality | "",
        medium_of_instruction: (child.medium_of_instruction ?? "") as MediumOfInstruction | "",
      } : defaultValues}
      onSubmit={async (values) => {
        setSaving(true)
        try {
          if (child) {
            const { data, error } = await updateChild({
              path: { id: child.id! },
              body: {
                full_name: values.full_name || null,
                name_with_initials: values.name_with_initials || null,
                date_of_birth: values.date_of_birth || null,
                gender: (values.gender || null) as Gender | null,
                nationality: (values.nationality || null) as Nationality | null,
                medium_of_instruction: (values.medium_of_instruction || null) as MediumOfInstruction | null,
              },
              client: apiClient,
            })
            if (error || !data) {
              toastApiError(error, "Failed to update child")
              return
            }
            toast.success(`${data.full_name} updated`)
            onSuccess(data as Child)
          } else {
            const { data, error } = await createChild({
              body: {
                full_name: values.full_name,
                name_with_initials: values.name_with_initials,
                date_of_birth: values.date_of_birth,
                gender: values.gender as Gender,
                nationality: values.nationality as Nationality,
                medium_of_instruction: values.medium_of_instruction as MediumOfInstruction,
              },
              client: apiClient,
            })
            if (error || !data) {
              toastApiError(error, "Failed to create child")
              return
            }
            toast.success(`${data.full_name} created`)
            onSuccess(data as Child)
          }
        } catch (err) {
          toastApiError(err, child ? "Failed to update child" : "Failed to create child")
        } finally {
          setSaving(false)
        }
      }}
      formId="create-child-form"
      hideDefaultButtons
    >
      <DialogFooter className="mt-4">
        <Button type="submit" form="create-child-form" disabled={saving}>
          {saving ? "Saving..." : child ? "Update Child" : "Create Child"}
        </Button>
      </DialogFooter>
    </FormBuilder>
  )
}
