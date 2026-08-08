"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import { FormBuilder } from "@/lib/form-builder"
import type { FormConfig } from "@/lib/form-builder"
import type { Child, Gender, MediumOfInstruction, Nationality, Religion } from "@/lib/api-client/types.gen"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import { createChild, updateChild } from "@/lib/api-client/sdk.gen"
import { FieldWithAlert } from "@/components/enrollment/g1/field-with-alert"
import { FormUniquenessProvider, useUniquenessBlocked } from "@/hooks/use-child-uniqueness"

type ChildFormValues = {
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

const defaultValues: ChildFormValues = {
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

function makeFormConfig(excludeChildId?: string | null): FormConfig<ChildFormValues> {
  return {
    fields: [
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
      { name: "name_with_initials", kind: "text", label: "Name with Initials", placeholder: "e.g. J. M. Perera" },
      { name: "date_of_birth", kind: "date", label: "Date of Birth" },
      {
        name: "gender", kind: "select", label: "Gender", required: true,
        options: [
          { value: "Male", label: "Male" },
          { value: "Female", label: "Female" },
        ],
        inputProps: { placeholder: "Select gender" },
      },
      {
        name: "nationality", kind: "select", label: "Nationality", required: true,
        options: [
          { value: "SriLankan", label: "Sri Lankan" },
          { value: "DualCitizen", label: "Dual Citizen" },
          { value: "Other", label: "Other" },
        ],
        inputProps: { placeholder: "Select nationality" },
      },
      {
        name: "religion", kind: "select", label: "Religion", required: true,
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
      },
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
      { name: "passport_number", kind: "text", label: "Passport Number", placeholder: "Optional (for overseas arrivals)" },
      {
        name: "medium_of_instruction", kind: "select", label: "Medium of Instruction", required: true,
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
      { columns: [{ fields: ["gender"], span: 4 }, { fields: ["nationality"], span: 4 }, { fields: ["religion"], span: 4 }] },
      { columns: [{ fields: ["birth_certificate_number"] }] },
      { columns: [{ fields: ["nic"] }] },
      { columns: [{ fields: ["passport_number"] }] },
      { columns: [{ fields: ["medium_of_instruction"] }] },
    ],
  }
}

function SubmitButton({ saving, isEdit }: { saving: boolean; isEdit: boolean }) {
  const { isBlocked } = useUniquenessBlocked()
  return (
    <DialogFooter className="mt-4">
      <Button type="submit" form="create-child-form" disabled={saving || isBlocked}>
        {saving ? "Saving..." : isEdit ? "Update Child" : "Create Child"}
      </Button>
    </DialogFooter>
  )
}

export function CreateChildForm({
  child,
  onSuccess,
}: {
  child?: Child | null
  onSuccess: (child: Child) => void
}) {
  const [saving, setSaving] = useState(false)
  const formConfig = makeFormConfig(child?.id)

  return (
    <FormUniquenessProvider>
      <FormBuilder<ChildFormValues>
        config={formConfig}
        defaultValues={child ? {
          full_name: child.full_name ?? "",
          name_with_initials: child.name_with_initials ?? "",
          date_of_birth: child.date_of_birth ?? "",
          gender: (child.gender ?? "") as Gender | "",
          nationality: (child.nationality ?? "") as Nationality | "",
          religion: (child.religion ?? "") as Religion | "",
          birth_certificate_number: child.birth_certificate_number ?? "",
          nic: child.nic ?? "",
          passport_number: child.passport_number ?? "",
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
                  religion: (values.religion || null) as Religion | null,
                  birth_certificate_number: values.birth_certificate_number || null,
                  nic: values.nic || null,
                  passport_number: values.passport_number || null,
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
                  religion: values.religion as Religion,
                  birth_certificate_number: values.birth_certificate_number,
                  nic: values.nic || null,
                  passport_number: values.passport_number || null,
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
        <SubmitButton saving={saving} isEdit={!!child} />
      </FormBuilder>
    </FormUniquenessProvider>
  )
}
