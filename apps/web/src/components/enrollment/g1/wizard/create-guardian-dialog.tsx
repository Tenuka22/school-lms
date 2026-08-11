"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { toastApiError, getApiErrorMessage } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import {
  createGuardianMutation,
  updateGuardianMutation,
  getApplicationGuardiansQueryKey,
  listGuardiansQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import { vCreateGuardianBody } from "@/lib/api-client/valibot.gen"
import { IconPlus } from "@tabler/icons-react"
import { FormBuilder } from "@/lib/form-builder"
import {
  makeGuardianFormConfig,
  guardianFormDefaults,
} from "@/components/forms/guardian-form"

type FormData = Record<string, unknown>

export function CreateGuardianDialog({
  enrollmentId,
  onCreated,
  onEditExisting,
}: {
  enrollmentId?: string
  onCreated: () => void
  onEditExisting?: (guardian: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [createdGuardian, setCreatedGuardian] = useState<any>(null)

  const createGuardian = useMutation(
    createGuardianMutation({ client: apiClient })
  )

  const updateGuardian = useMutation(
    updateGuardianMutation({ client: apiClient })
  )

  const formConfig = makeGuardianFormConfig({ contactPhoneRequired: true })

  const handleSubmit = async (data: FormData) => {
    const v = data as any
    try {
      if (step === 1) {
        const result = await createGuardian.mutateAsync({ body: v })
        setCreatedGuardian(result)
        setStep(2)
        toast.success(`${v.full_name} created`)
      } else {
        if (!createdGuardian) return
        await updateGuardian.mutateAsync({
          path: { id: createdGuardian.id },
          body: {
            relationship_type: v.relationship_type,
            full_name: v.full_name,
            nic_number: v.nic_number,
            contact_phone: v.contact_phone,
            contact_email: v.contact_email ?? null,
            occupation: v.occupation ?? null,
            workplace_name: v.workplace_name ?? null,
            workplace_address: v.workplace_address ?? null,
            is_govt_employee: v.is_govt_employee,
            govt_service_years: v.govt_service_years,
            is_school_staff: v.is_school_staff,
            staff_type: v.staff_type,
            employee_id: v.employee_id,
            staff_school_id: v.staff_school_id,
            is_past_pupil: v.is_past_pupil,
            income_level: v.income_level,
            past_pupil_student_id: v.past_pupil_student_id,
            past_pupil_highest_grade: v.past_pupil_highest_grade,
            past_pupil_year_left: v.past_pupil_year_left,
            past_pupil_left_reason: v.past_pupil_left_reason,
            past_pupil_school_id: v.past_pupil_school_id,
            student_id: v.student_id ?? null,
          },
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
        setOpen(false)
        setStep(1)
        setCreatedGuardian(null)
        onCreated()
      }
    } catch (err) {
      if (step === 1) {
        const msg = getApiErrorMessage(err) ?? ""
        const idMatch = msg.match(/already exists \(id: ([^)]+)\)/)
        if (idMatch && onEditExisting) {
          const existingId = idMatch[1]
          const guardians = queryClient.getQueryData(
            listGuardiansQueryKey({ client: apiClient })
          ) as any[]
          const existing = guardians?.find((g: any) => g.id === existingId)
          if (existing) {
            toast.info(
              `Guardian with this NIC already exists. Opening edit form.`
            )
            setOpen(false)
            setStep(1)
            setCreatedGuardian(null)
            onEditExisting(existing)
            return
          }
        }
      }
      toastApiError(
        err,
        step === 1 ? "Failed to create guardian" : "Failed to update guardian"
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setStep(1)
          setCreatedGuardian(null)
        }
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="w-full">
            <IconPlus className="mr-2 size-4" />
            Create Guardian
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Guardian Details" : "Enrollment Categories"}
          </DialogTitle>
        </DialogHeader>
        <FormBuilder
          config={formConfig}
          defaultValues={guardianFormDefaults}
          valibotSchema={step === 2 ? vCreateGuardianBody : undefined}
          onSubmit={handleSubmit}
          formId="create-guardian-form"
          currentStep={step}
          hideDefaultButtons
        >
          <div className="flex justify-between gap-2 border-t pt-2">
            <div>
              {step === 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                >
                  &larr; Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  setStep(1)
                  setCreatedGuardian(null)
                }}
              >
                Cancel
              </Button>
              {step === 1 ? (
                <Button type="submit" form="create-guardian-form">
                  Next &rarr;
                </Button>
              ) : (
                <Button type="submit" form="create-guardian-form">
                  Save Guardian
                </Button>
              )}
            </div>
          </div>
        </FormBuilder>
      </DialogContent>
    </Dialog>
  )
}
