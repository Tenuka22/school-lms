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
import { IconPlus, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import type { Guardian, GuardianWithChildren } from "@/lib/api-client/types.gen"
import { FormBuilder } from "@/lib/form-builder"
import {
  makeGuardianFormConfig,
  guardianFormDefaults,
} from "@/components/forms/guardian-form"

type FormData = Record<string, unknown>

interface GuardianDialogBaseProps {
  enrollmentId?: string
  onSaved: () => void
}

interface CreateMode extends GuardianDialogBaseProps {
  mode: "create"
  onEditExisting?: (guardian: any) => void
}

interface EditMode extends GuardianDialogBaseProps {
  mode: "edit"
  guardian: Guardian | GuardianWithChildren
  open: boolean
  onOpenChange: (v: boolean) => void
}

type GuardianDialogProps = CreateMode | EditMode

function buildGuardianDefaults(guardian: Guardian | GuardianWithChildren) {
  return {
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
}

function buildUpdateBody(
  v: any,
  includeCategories: boolean,
  guardian?: Guardian | GuardianWithChildren
) {
  return {
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
      : guardian?.is_govt_employee,
    govt_service_years: includeCategories
      ? v.govt_service_years
      : guardian?.govt_service_years,
    is_school_staff: includeCategories
      ? v.is_school_staff
      : guardian?.is_school_staff,
    staff_type: includeCategories ? v.staff_type : null,
    employee_id: includeCategories ? v.employee_id : null,
    staff_school_id: includeCategories ? v.staff_school_id : null,
    is_past_pupil: includeCategories
      ? v.is_past_pupil
      : guardian?.is_past_pupil,
    income_level: includeCategories ? v.income_level : guardian?.income_level,
    past_pupil_student_id: includeCategories ? v.past_pupil_student_id : null,
    past_pupil_highest_grade: includeCategories
      ? v.past_pupil_highest_grade
      : null,
    past_pupil_year_left: includeCategories ? v.past_pupil_year_left : null,
    past_pupil_left_reason: includeCategories ? v.past_pupil_left_reason : null,
    past_pupil_school_id: includeCategories ? v.past_pupil_school_id : null,
    student_id: includeCategories
      ? (v.student_id ?? null)
      : ((guardian as any)?.student_id ?? null),
  }
}

export function GuardianDialog(props: GuardianDialogProps) {
  if (props.mode === "create") {
    return <CreateGuardianDialogInner {...props} />
  }
  return (
    <EditGuardianDialogInner
      guardian={props.guardian}
      open={props.open}
      onOpenChange={props.onOpenChange}
      onSaved={props.onSaved}
      enrollmentId={props.enrollmentId}
    />
  )
}

function CreateGuardianDialogInner({
  enrollmentId,
  onSaved,
  onEditExisting,
}: CreateMode) {
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
        setOpen(false)
        setStep(1)
        setCreatedGuardian(null)
        onSaved()
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

  const formId = "create-guardian-form"

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
          formId={formId}
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
                  <IconChevronLeft className="mr-1 size-4" /> Back
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
                <Button type="submit" form={formId}>
                  Next <IconChevronRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button type="submit" form={formId}>
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

function EditGuardianDialogInner({
  guardian,
  open,
  onOpenChange,
  onSaved,
  enrollmentId,
}: Omit<EditMode, "mode">) {
  const [step, setStep] = useState(1)

  const updateGuardian = useMutation(
    updateGuardianMutation({ client: apiClient })
  )

  const defaultValues = buildGuardianDefaults(guardian)
  const formConfig = makeGuardianFormConfig()

  const handleSubmit = async (data: FormData) => {
    const v = data as any
    try {
      if (step === 1) {
        await updateGuardian.mutateAsync({
          path: { id: guardian.id },
          body: buildUpdateBody(v, false, guardian),
        })
        setStep(2)
        toast.success("Guardian details saved")
      } else {
        await updateGuardian.mutateAsync({
          path: { id: guardian.id },
          body: buildUpdateBody(v, true, guardian),
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

  const formId = "edit-guardian-form"

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
          formId={formId}
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
                <Button type="submit" form={formId}>
                  Next <IconChevronRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  form={formId}
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
