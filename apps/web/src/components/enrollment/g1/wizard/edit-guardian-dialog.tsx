"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import {
  updateGuardianMutation,
  getApplicationGuardiansQueryKey,
  listGuardiansQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { vCreateGuardianBody } from "@/lib/api-client/valibot.gen"
import { queryClient } from "@/router"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import type { Guardian, GuardianWithChildren } from "@/lib/api-client/types.gen"
import { FormBuilder } from "@/lib/form-builder"
import { makeGuardianFormConfig } from "@/components/forms/guardian-form"

export function EditGuardianDialog({
  guardian,
  open,
  onOpenChange,
  onSaved,
  enrollmentId,
}: {
  guardian: Guardian | GuardianWithChildren
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
  enrollmentId?: string
}) {
  const [step, setStep] = useState(1)

  const updateGuardian = useMutation(
    updateGuardianMutation({ client: apiClient })
  )

  type FormData = Record<string, unknown>

  const defaultValues: FormData = {
    full_name: guardian.full_name,
    nic_number: guardian.nic_number,
    contact_phone: guardian.contact_phone,
    contact_email: guardian.contact_email ?? null,
    occupation: guardian.occupation ?? null,
    workplace_name: guardian.workplace_name ?? null,
    workplace_address: guardian.workplace_address ?? null,
    relationship_type: guardian.relationship_type,
    is_school_staff: guardian.is_school_staff,
    staff_type: null as string | null,
    employee_id: null as string | null,
    staff_school_id: null as string | null,
    is_past_pupil: guardian.is_past_pupil,
    is_govt_employee: guardian.is_govt_employee,
    income_level: guardian.income_level ?? null,
    govt_service_years: guardian.govt_service_years ?? null,
    past_pupil_student_id: null as string | null,
    past_pupil_highest_grade: null as string | null,
    past_pupil_year_left: null as number | null,
    past_pupil_left_reason: null as string | null,
    past_pupil_school_id: null as string | null,
    student_id: (guardian as any).student_id ?? null,
  }

  const buildUpdateBody = (v: any, includeCategories: boolean) => ({
    relationship_type: v.relationship_type,
    full_name: v.full_name,
    nic_number: v.nic_number,
    contact_phone: v.contact_phone ?? "0",
    contact_email: v.contact_email ?? null,
    occupation: v.occupation ?? null,
    workplace_name: v.workplace_name ?? null,
    workplace_address: v.workplace_address ?? null,
    is_govt_employee: includeCategories
      ? v.is_govt_employee
      : guardian.is_govt_employee,
    govt_service_years: includeCategories
      ? v.govt_service_years
      : guardian.govt_service_years,
    is_school_staff: includeCategories
      ? v.is_school_staff
      : guardian.is_school_staff,
    staff_type: includeCategories ? v.staff_type : null,
    employee_id: includeCategories ? v.employee_id : null,
    staff_school_id: includeCategories ? v.staff_school_id : null,
    is_past_pupil: includeCategories ? v.is_past_pupil : guardian.is_past_pupil,
    income_level: includeCategories ? v.income_level : guardian.income_level,
    past_pupil_student_id: includeCategories ? v.past_pupil_student_id : null,
    past_pupil_highest_grade: includeCategories
      ? v.past_pupil_highest_grade
      : null,
    past_pupil_year_left: includeCategories ? v.past_pupil_year_left : null,
    past_pupil_left_reason: includeCategories ? v.past_pupil_left_reason : null,
    past_pupil_school_id: includeCategories ? v.past_pupil_school_id : null,
    student_id: includeCategories
      ? (v.student_id ?? null)
      : ((guardian as any).student_id ?? null),
  })

  const formConfig = makeGuardianFormConfig()

  const handleSubmit = async (data: FormData) => {
    const v = data as any
    try {
      if (step === 1) {
        await updateGuardian.mutateAsync({
          path: { id: guardian.id },
          body: buildUpdateBody(v, false),
        })
        setStep(2)
        toast.success("Guardian details saved")
      } else {
        await updateGuardian.mutateAsync({
          path: { id: guardian.id },
          body: buildUpdateBody(v, true),
        })
        queryClient.invalidateQueries({
          queryKey: listGuardiansQueryKey({ client: apiClient }),
        })
        if (enrollmentId) {
          queryClient.invalidateQueries({
            queryKey: getApplicationGuardiansQueryKey({
              path: { id: enrollmentId },
              client: apiClient,
            }),
          })
        }
        toast.success(`${v.full_name} updated`)
        onOpenChange(false)
        setStep(1)
        onSaved()
      }
    } catch (err) {
      toastApiError(
        err,
        step === 1
          ? "Failed to save guardian details"
          : "Failed to update guardian"
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) setStep(1)
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Edit Guardian" : "Enrollment Categories"}
          </DialogTitle>
        </DialogHeader>
        <FormBuilder
          config={formConfig}
          defaultValues={defaultValues}
          valibotSchema={vCreateGuardianBody}
          onSubmit={handleSubmit}
          formId="edit-guardian-form"
          currentStep={step}
          hideDefaultButtons
          submitting={updateGuardian.isPending}
        >
          <div className="flex justify-between gap-2 border-t pt-4">
            <div>
              {step === 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                >
                  <IconChevronLeft className="mr-1 size-4" /> Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  setStep(1)
                }}
              >
                Cancel
              </Button>
              {step === 1 ? (
                <Button type="submit" form="edit-guardian-form">
                  Next <IconChevronRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="edit-guardian-form"
                  disabled={updateGuardian.isPending}
                >
                  {updateGuardian.isPending ? "Saving..." : "Save Guardian"}
                </Button>
              )}
            </div>
          </div>
        </FormBuilder>
      </DialogContent>
    </Dialog>
  )
}
