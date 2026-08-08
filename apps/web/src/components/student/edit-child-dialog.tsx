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
import { makeChildFormConfig } from "@/components/forms/child-form"
import type { ChildFormValues } from "@/components/forms/child-form"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import { updateChild } from "@/lib/api-client/sdk.gen"
import type { Gender, MediumOfInstruction, Nationality, Religion } from "@/lib/api-client/types.gen"
import type { Child } from "@/lib/api-client/types.gen"

export function EditChildDialog({
  child,
  onOpenChange,
  onSuccess,
}: {
  child: Child | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const formConfig = makeChildFormConfig()
  const open = child !== null

  const defaultValues: ChildFormValues = child
    ? {
        full_name: child.full_name,
        name_with_initials: child.name_with_initials,
        date_of_birth: child.date_of_birth,
        gender: child.gender as ChildFormValues["gender"],
        nationality: child.nationality as ChildFormValues["nationality"],
        religion: (child.religion ?? "") as ChildFormValues["religion"],
        birth_certificate_number: child.birth_certificate_number ?? "",
        nic: child.nic ?? "",
        passport_number: child.passport_number ?? "",
        medium_of_instruction: child.medium_of_instruction as ChildFormValues["medium_of_instruction"],
      }
    : {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {child?.full_name}</DialogTitle>
          <DialogDescription>Update the child&apos;s details below.</DialogDescription>
        </DialogHeader>
        {child && (
          <FormBuilder<ChildFormValues>
            config={formConfig}
            defaultValues={defaultValues}
            onSubmit={async (values) => {
              setSaving(true)
              try {
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
                    medium_of_instruction: values.medium_of_instruction as MediumOfInstruction,
                  },
                  client: apiClient,
                })
                if (error) {
                  toastApiError(error, "Failed to update child")
                  return
                }
                toast.success(`${values.full_name} updated`)
                onSuccess()
              } catch (err) {
                toastApiError(err, "Failed to update child")
              } finally {
                setSaving(false)
              }
            }}
            formId="edit-child-form"
            hideDefaultButtons
          >
            <div className="flex justify-end gap-3 pt-4">
              <Button type="submit" form="edit-child-form" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </FormBuilder>
        )}
      </DialogContent>
    </Dialog>
  )
}
