"use client"

import { EntityDialog } from "@/lib/form-builder"
import {
  makeChildFormConfig,
  childFormDefaults,
} from "@/components/forms/child-form"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import { createChild } from "@/lib/api-client/sdk.gen"
import type {
  Gender,
  MediumOfInstruction,
  Nationality,
  Religion,
} from "@/lib/api-client/types.gen"
import { FormUniquenessProvider } from "@/hooks/use-child-uniqueness"

export function CreateChildDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const formConfig = makeChildFormConfig()

  return (
    <FormUniquenessProvider>
      <EntityDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Create New Child"
        description="Enter the required details to create a new child record."
        config={formConfig}
        defaultValues={childFormDefaults}
        onSubmit={async (values) => {
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
              medium_of_instruction:
                values.medium_of_instruction as MediumOfInstruction,
            },
            client: apiClient,
          })
          if (error || !data) {
            toastApiError(error, "Failed to create child")
            throw error
          }
          toast.success(`${data.full_name} created`)
          onSuccess()
          onOpenChange(false)
        }}
        actionLabel="Create Child"
        size="xl"
      />
    </FormUniquenessProvider>
  )
}
