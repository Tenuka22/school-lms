"use client"

import { EntityDialog } from "@/lib/form-builder"
import {
  makeChildFormConfig,
  childFormDefaults,
} from "@/components/forms/child-form"
import type { ChildFormValues } from "@/components/forms/child-form"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import { updateChild } from "@/lib/api-client/sdk.gen"
import type {
  Gender,
  MediumOfInstruction,
  Nationality,
  Religion, Child 
} from "@/lib/api-client/types.gen"

function childToFormValues(child: Child): ChildFormValues {
  return {
    full_name: child.full_name,
    name_with_initials: child.name_with_initials,
    date_of_birth: child.date_of_birth,
    gender: child.gender,
    nationality: child.nationality,
    religion: (child.religion ?? ""),
    birth_certificate_number: child.birth_certificate_number ?? "",
    nic: child.nic ?? "",
    passport_number: child.passport_number ?? "",
    medium_of_instruction:
      child.medium_of_instruction,
  }
}

export function EditChildDialog({
  child,
  onOpenChange,
  onSuccess,
}: {
  child: Child | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const formConfig = makeChildFormConfig(child?.id)
  const open = child !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${child?.full_name ?? ""}`}
      description="Update the child's details below."
      config={formConfig}
      defaultValues={child ? childToFormValues(child) : childFormDefaults}
      onSubmit={async (values) => {
        if (!child) return
        const { error } = await updateChild({
          path: { id: child.id },
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
            medium_of_instruction:
              values.medium_of_instruction as MediumOfInstruction,
          },
          client: apiClient,
        })
        if (error) {
          toastApiError(error, "Failed to update child")
          return
        }
        toast.success(`${values.full_name} updated`)
        onSuccess()
        onOpenChange(false)
      }}
      actionLabel="Save Changes"
      size="xl"
    />
  )
}
