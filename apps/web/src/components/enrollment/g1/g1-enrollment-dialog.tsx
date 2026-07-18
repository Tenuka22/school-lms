"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import * as v from "valibot"
import { Calendar as CalendarIcon, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { createEnrollment, } from "@/lib/api-client/sdk.gen"
import { getEnrollmentQueryKey, listBatchesOptions, listBatchesQueryKey, listEnrollmentsQueryKey, updateEnrollmentMutation } from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import {
  vG1Enrollment,
  vUpdateG1EnrollmentBody,
  vGender,
  vNationality,
  vG1Category,
  vMediumOfInstruction,
  vEnrollmentStatus,
  vReligion,
} from "@/lib/api-client/valibot.gen"
import { formatDate } from "@/lib/format"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import type { G1Enrollment } from "@/lib/api-client/types.gen"
import { CreateBatchDialog } from "@/components/enrollment/g1/create-batch-dialog"

const LABELS: Record<string, string> = {
  CloseResident: "Close Resident",
  PastPupilChild: "Past Pupil Child",
  Sibling: "Sibling",
  MOEOrUGCStaffChild: "MOE or UGC Staff Child",
  GovernmentTransferOfficerChild: "Government Transfer Officer Child",
  OverseasArrival: "Overseas Arrival",
  ArmedForcesReserved: "Armed Forces Reserved",
  Male: "Male",
  Female: "Female",
  Sinhala: "Sinhala",
  Tamil: "Tamil",
  SriLankan: "Sri Lankan",
  DualCitizen: "Dual Citizen",
  Other: "Other",
  Buddhism: "Buddhism",
  Hinduism: "Hinduism",
  Islam: "Islam",
  Christianity: "Christianity",
  Catholicism: "Catholicism",
  Draft: "Draft",
  Pending: "Pending",
  ProvisionallyApproved: "Provisionally Approved",
  Approved: "Approved",
  Rejected: "Rejected",
  Withdrawn: "Withdrawn",
  Removed: "Removed",
}

function getBatchYears(batches?: { year: number }[]): number[] {
  if (!batches) return []
  const years = new Set(batches.map((b) => b.year))
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y <= currentYear + 12; y++) {
    years.add(y)
  }
  return Array.from(years).sort((a, b) => b - a)
}

interface G1EnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrollment?: G1Enrollment | null
  onSuccess: () => void
}

export function G1EnrollmentDialog({
  open,
  onOpenChange,
  enrollment,
  onSuccess,
}: G1EnrollmentDialogProps) {
  const isEdit = !!enrollment
  const updateEnrollment = useMutation(updateEnrollmentMutation({
    client:apiClient
  }))
  const [createBatchOpen, setCreateBatchOpen] = useState(false)
  const [createBatchYear, setCreateBatchYear] = useState<number | undefined>()
  const [selectedBatchYear, setSelectedBatchYear] = useState<number | undefined>(
    () => enrollment ? undefined : new Date().getFullYear(),
  )
  const { data: batches } = useQuery({
    ...listBatchesOptions({ client: apiClient }),
    enabled: open,
  })

  const computedYear = enrollment?.batch_id && batches
    ? batches.find((b) => b.id === enrollment.batch_id)?.year
    : undefined
  if (computedYear && selectedBatchYear == null) {
    setSelectedBatchYear(computedYear)
  }

  const selectedBatch = selectedBatchYear && batches
    ? batches.find((b) => b.year === selectedBatchYear)
    : undefined

  const needsBatch = !!(selectedBatchYear && !selectedBatch)

  const form = useForm({
    defaultValues: {
      full_name: enrollment?.full_name ?? "",
      name_with_initials: enrollment?.name_with_initials ?? "",
      date_of_birth: enrollment?.date_of_birth ?? "",
      gender: enrollment?.gender ?? "Male",
      nationality: enrollment?.nationality ?? "SriLankan",
      category: enrollment?.category ?? "CloseResident",
      medium_of_instruction: enrollment?.medium_of_instruction ?? "Sinhala",
      enrollment_status: enrollment?.enrollment_status ?? "Draft",
      religion: enrollment?.religion ?? null,
      batch_id: enrollment?.batch_id ?? "",
    } as v.InferInput<typeof vG1Enrollment>,
    validators: {
      onSubmit: isEdit ? vUpdateG1EnrollmentBody : vG1Enrollment,
    },
    onSubmit: async ({ value }) => {
      try {
        if (isEdit && enrollment?.id) {

          await updateEnrollment.mutateAsync({
            body: value,
            path: { id: enrollment.id },
            client: apiClient,
          })
          queryClient.invalidateQueries({ queryKey: getEnrollmentQueryKey({ path: { id: enrollment.id }, client: apiClient }) })
          toast.success("Enrollment updated")
        } else {
          await createEnrollment({
            body: { ...value, id: crypto.randomUUID() },
            client: apiClient,
          })
          toast.success("Enrollment created")
        }
        queryClient.invalidateQueries({ queryKey: listEnrollmentsQueryKey({ client: apiClient }) })
        onOpenChange(false)
        onSuccess()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Operation failed"
        toast.error(message)
      }
    },
  })

  if (selectedBatch?.id && !form.state.values.batch_id) {
    form.setFieldValue("batch_id", selectedBatch.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[75vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Enrollment" : "Add Enrollment"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the enrollment details below."
              : "Fill in the details to add a new enrollment."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="enrollment-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="full_name"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="John Doe"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <form.Field
              name="name_with_initials"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name with Initials</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="J. Doe"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <form.Field
              name="date_of_birth"
              children={(field) => {
                const dateValue = field.state.value
                  ? new Date(field.state.value + "T12:00:00")
                  : undefined
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Date of Birth</FieldLabel>
                    <Popover>
                      <PopoverTrigger
                        id={field.name}
                        aria-invalid={isInvalid}
                        render={<Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 size-4 shrink-0" />
                          {dateValue ? formatDate(dateValue) : <span className="text-muted-foreground">Pick a date</span>}
                        </Button>}
                      />
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateValue}
                          defaultMonth={dateValue}
                          onSelect={(d) => {
                            if (!d) { field.handleChange(""); return }
                            const y = d.getFullYear()
                            const m = String(d.getMonth() + 1).padStart(2, "0")
                            const day = String(d.getDate()).padStart(2, "0")
                            field.handleChange(`${y}-${m}-${day}`)
                          }}
                          captionLayout="dropdown"
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <form.Field
              name="gender"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Gender</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => val && field.handleChange(val as "Male" | "Female")}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {vGender.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {LABELS[opt]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <form.Field
              name="nationality"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Nationality</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => val && field.handleChange(val as "SriLankan" | "DualCitizen" | "Other")}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {vNationality.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {LABELS[opt]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <form.Field
              name="category"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => val && field.handleChange(val as "CloseResident" | "PastPupilChild" | "Sibling" | "MOEOrUGCStaffChild" | "GovernmentTransferOfficerChild" | "OverseasArrival" | "ArmedForcesReserved")}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {vG1Category.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {LABELS[opt] ?? opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <form.Field
              name="medium_of_instruction"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Medium of Instruction</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => val && field.handleChange(val as "Sinhala" | "Tamil")}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Select medium" />
                      </SelectTrigger>
                      <SelectContent>
                        {vMediumOfInstruction.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {LABELS[opt]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <form.Field
              name="enrollment_status"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => val && field.handleChange(val as "Draft" | "Pending" | "ProvisionallyApproved" | "Approved" | "Rejected" | "Withdrawn" | "Removed")}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {vEnrollmentStatus.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {LABELS[opt] ?? opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <form.Field
              name="religion"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Religion</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value ?? ""}
                      onValueChange={(val) => field.handleChange(val as "Buddhism" | "Hinduism" | "Islam" | "Christianity" | "Catholicism" | "Other" | null)}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Select religion (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {vReligion.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {LABELS[opt]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <form.Field
              name="batch_id"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                const batchYears = getBatchYears(batches)
                return (
                  <Field data-invalid={isInvalid}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FieldLabel>Type</FieldLabel>
                        <Select disabled value="G1">
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="G1">G1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FieldLabel htmlFor="batch-year">Year</FieldLabel>
                        <Select
                          name="batch-year"
                          value={selectedBatchYear?.toString() ?? ""}
                          onValueChange={(val) => {
                            if (!val) return
                            const year = parseInt(val, 10)
                            if (!isNaN(year)) {
                              setSelectedBatchYear(year)
                              const batch = batches?.find((b) => b.year === year)
                              if (batch?.id) field.handleChange(batch.id)
                            }
                          }}
                        >
                          <SelectTrigger id="batch-year" className="w-full">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {batchYears.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {needsBatch && (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => {
                          setCreateBatchYear(selectedBatchYear)
                          setCreateBatchOpen(true)
                        }}
                      >
                        <Plus className="mr-2 size-4" />
                        Create Batch
                      </Button>
                    )}
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <CreateBatchDialog
              open={createBatchOpen}
              onOpenChange={(v) => {
                setCreateBatchOpen(v)
                if (!v) setCreateBatchYear(undefined)
              }}
              onSuccess={async (batch) => {
                await queryClient.refetchQueries({ queryKey: listBatchesQueryKey({ client: apiClient }) })

                if (batch.id) {
                  form.setFieldValue("batch_id", batch.id)
                  setSelectedBatchYear(batch.year)
                }
                setCreateBatchYear(undefined)
              }}
              defaultYear={createBatchYear}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="enrollment-form" disabled={needsBatch}>
            {needsBatch ? "Create Batch First" : isEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
