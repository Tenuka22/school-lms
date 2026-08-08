"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { FormBuilder } from "@/lib/form-builder"
import { makeChildFormConfig, childFormDefaults } from "@/components/forms/child-form"
import type { ChildFormValues } from "@/components/forms/child-form"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import { createChild } from "@/lib/api-client/sdk.gen"
import type { Gender, MediumOfInstruction, Nationality, Religion } from "@/lib/api-client/types.gen"
import { FormUniquenessProvider, useUniquenessBlocked } from "@/hooks/use-child-uniqueness"

function SubmitButton({ saving }: { saving: boolean }) {
  const { isBlocked } = useUniquenessBlocked()
  return (
    <div className="flex justify-end gap-3 pt-4">
      <Button type="submit" form="create-child-form" disabled={saving || isBlocked}>
        {saving ? "Saving..." : "Create Child"}
      </Button>
    </div>
  )
}

export function CreateChildDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const formConfig = makeChildFormConfig()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Child</DialogTitle>
          <DialogDescription>
            Enter the required details to create a new child record.
          </DialogDescription>
        </DialogHeader>
        <FormUniquenessProvider>
          <FormBuilder<ChildFormValues>
            config={formConfig}
            defaultValues={childFormDefaults}
            onSubmit={async (values) => {
              setSaving(true)
              try {
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
                onSuccess()
                onOpenChange(false)
              } catch (err) {
                toastApiError(err, "Failed to create child")
              } finally {
                setSaving(false)
              }
            }}
            formId="create-child-form"
            hideDefaultButtons
          >
            <SubmitButton saving={saving} />
          </FormBuilder>
        </FormUniquenessProvider>
      </DialogContent>
    </Dialog>
  )
}
