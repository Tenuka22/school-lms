"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import type { Child, Gender, MediumOfInstruction, Nationality, Religion } from "@/lib/api-client/types.gen"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import { createChild, updateChild } from "@/lib/api-client/sdk.gen"
import { FormBuilder } from "@/lib/form-builder"
import { FormUniquenessProvider, useUniquenessBlocked } from "@/hooks/use-child-uniqueness"
import { makeChildFormConfig } from "@/components/forms/child-form"
import type { ChildFormValues } from "@/components/forms/child-form"

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
  const formConfig = makeChildFormConfig(child?.id)

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
        } : {
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
        }}
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
