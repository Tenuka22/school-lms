"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { IconCalendar, IconPlus } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { createApplication } from "@/lib/api-client/sdk.gen"
import {
  createChildMutation,
  updateChildMutation,
  getApplicationQueryKey,
  listBatchesOptions,
  listBatchesQueryKey,
  listApplicationsQueryKey,
  updateApplicationMutation,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"


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
import type { Child, G1Application } from "@/lib/api-client/types.gen"
import { CreateBatchDialog } from "@/components/enrollment/g1/create-batch-dialog"



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
  enrollment?: G1Application | null
  onSuccess: () => void
}

export function G1EnrollmentDialog({
  open,
  onOpenChange,
  enrollment,
  onSuccess,
}: G1EnrollmentDialogProps) {
  const isEdit = !!enrollment
  const updateApplication = useMutation(
    updateApplicationMutation({
      client: apiClient,
    })
  )
  const createChild = useMutation(createChildMutation({ client: apiClient }))
  const updateChild = useMutation(updateChildMutation({ client: apiClient }))
  const [createBatchOpen, setCreateBatchOpen] = useState(false)
  const [createBatchYear, setCreateBatchYear] = useState<number | undefined>()
  const [selectedBatchYear, setSelectedBatchYear] = useState<
    number | undefined
  >(() => (enrollment ? undefined : new Date().getFullYear()))
  const { data: batches } = useQuery({
    ...listBatchesOptions({ client: apiClient }),
    enabled: open,
  })

  const [childId, setChildId] = useState<string | null>(null)

  useEffect(() => {
    if (enrollment?.batch_id && batches) {
      const year = batches.find((b) => b.id === enrollment.batch_id)?.year
      if (year && selectedBatchYear == null) {
        setSelectedBatchYear(year)
      }
    }
    if (enrollment?.child_id) {
      setChildId(enrollment.child_id)
    }
  }, [enrollment?.batch_id, enrollment?.child_id, batches, selectedBatchYear])

  const selectedBatch =
    selectedBatchYear && batches
      ? batches.find((b) => b.year === selectedBatchYear)
      : undefined

  const needsBatch = !!(selectedBatchYear && !selectedBatch)

  const form = useForm({
    defaultValues: {
      full_name: "",
      name_with_initials: "",
      date_of_birth: "",
      gender: "Male" as string,
      nationality: "SriLankan" as string,
      medium_of_instruction: "Sinhala" as string,
      religion: null as string | null,
      birth_certificate_number: null as string | null,
      batch_id: enrollment?.batch_id ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        let savedChildId = childId
        if (!savedChildId) {
          const childBody = {
            full_name: value.full_name,
            name_with_initials: value.name_with_initials,
            date_of_birth: value.date_of_birth,
            gender: value.gender as Child['gender'],
            nationality: value.nationality as Child['nationality'],
            birth_certificate_number: value.birth_certificate_number || null,
            medium_of_instruction: value.medium_of_instruction as Child['medium_of_instruction'],
            religion: value.religion as Child['religion'],
          } satisfies Omit<Child, 'id' | 'created_at' | 'student_id' | 'disability_status' | 'disability_type' | 'photo_url' | 'updated_at'>
          const child = await createChild.mutateAsync({
            body: childBody as Child,
          })
          savedChildId = child.id
          setChildId(savedChildId)
        }
        if (isEdit && savedChildId) {
          const updateBody: Child = {
            id: savedChildId,
            full_name: value.full_name,
            name_with_initials: value.name_with_initials,
            date_of_birth: value.date_of_birth,
            gender: value.gender as Child['gender'],
            nationality: value.nationality as Child['nationality'],
            medium_of_instruction: value.medium_of_instruction as Child['medium_of_instruction'],
            religion: value.religion as Child['religion'],
          }
          await updateChild.mutateAsync({
            path: { id: savedChildId },
            body: updateBody,
          })
        }

        if (isEdit && enrollment.id) {
          const appBody = {
            child_id: savedChildId,
            batch_id: value.batch_id,
            age_eligibility_verified: false,
            alternative_age_certificate: false,
            birth_certificate_verified: false,
            category_verified: false,
            interview_completed: false,
            residence_verified: false,
          } satisfies G1Application
          await updateApplication.mutateAsync({
            body: appBody,
            path: { id: enrollment.id },
            client: apiClient,
          })
          queryClient.invalidateQueries({
            queryKey: getApplicationQueryKey({
              path: { id: enrollment.id },
              client: apiClient,
            }),
          })
          toast.success("Enrollment updated")
        } else {
          const appBody = {
            child_id: savedChildId,
            batch_id: value.batch_id,
            age_eligibility_verified: false,
            alternative_age_certificate: false,
            birth_certificate_verified: false,
            category_verified: false,
            interview_completed: false,
            residence_verified: false,
          } satisfies G1Application
          await createApplication({
            body: appBody,
            client: apiClient,
          })
          toast.success("Enrollment created")
        }
        queryClient.invalidateQueries({
          queryKey: listApplicationsQueryKey({ client: apiClient }),
        })
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
      <DialogContent className="max-h-[75vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Enrollment" : "Add Enrollment"}
          </DialogTitle>
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
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
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
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="name_with_initials"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Name with Initials
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="J. Doe"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
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
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Date of Birth</FieldLabel>
                    <Popover>
                      <PopoverTrigger
                        id={field.name}
                        aria-invalid={isInvalid}
                        render={
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <IconCalendar className="mr-2 size-4 shrink-0" />
                            {dateValue ? (
                              formatDate(dateValue)
                            ) : (
                              <span className="text-muted-foreground">
                                Pick a date
                              </span>
                            )}
                          </Button>
                        }
                      />
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateValue}
                          defaultMonth={dateValue}
                          onSelect={(d) => {
                            if (!d) {
                              field.handleChange("")
                              return
                            }
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
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="gender"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Gender</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => val && field.handleChange(val)}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="nationality"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Nationality</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => val && field.handleChange(val)}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SriLankan">Sri Lankan</SelectItem>
                        <SelectItem value="DualCitizen">
                          Dual Citizen
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="medium_of_instruction"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Medium of Instruction
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => val && field.handleChange(val)}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sinhala">Sinhala</SelectItem>
                        <SelectItem value="Tamil">Tamil</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="religion"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Religion</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value ?? ""}
                      onValueChange={(val) =>
                        field.handleChange(val ?? null)
                      }
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Select (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buddhism">Buddhism</SelectItem>
                        <SelectItem value="Hinduism">Hinduism</SelectItem>
                        <SelectItem value="Islam">Islam</SelectItem>
                        <SelectItem value="Christianity">
                          Christianity
                        </SelectItem>
                        <SelectItem value="Catholicism">Catholicism</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </FieldGroup>

          <div className="mt-6">
            <form.Field
              name="batch_id"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Batch</FieldLabel>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select
                          name={field.name}
                          value={field.state.value}
                          onValueChange={(val) => {
                            if (val) field.handleChange(val)
                            const batch = batches?.find(
                              (b) => b.id === val
                            )
                            if (batch) {
                              setSelectedBatchYear(batch.year)
                            }
                          }}
                        >
                          <SelectTrigger
                            id={field.name}
                            aria-invalid={isInvalid}
                          >
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {getBatchYears(batches).map((year) => {
                              const yearBatches = (
                                batches ?? []
                              ).filter((b) => b.year === year)
                              return (
                                <div key={year}>
                                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                                    {year}
                                  </div>
                                  {yearBatches.length > 0 ? (
                                    yearBatches.map((b) => (
                                      <SelectItem key={b.id} value={b.id}>
                                        {b.batch_name} ({b.status})
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-xs"
                                      onClick={() => {
                                        setCreateBatchYear(year)
                                        setCreateBatchOpen(true)
                                      }}
                                    >
                                      <IconPlus className="mr-1 size-3" />
                                      Create batch {year}
                                    </Button>
                                  )}
                                </div>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </div>
        </form>
        <DialogFooter>
          {needsBatch && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateBatchYear(selectedBatchYear)
                setCreateBatchOpen(true)
              }}
            >
              <IconPlus className="mr-1.5 size-4" />
              Create Batch
            </Button>
          )}
          <Button type="submit" form="enrollment-form">
            {isEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <CreateBatchDialog
        open={createBatchOpen}
        onOpenChange={(open) => {
          setCreateBatchOpen(open)
          if (!open) {
            queryClient.invalidateQueries({
              queryKey: listBatchesQueryKey({ client: apiClient }),
            })
          }
        }}
        defaultYear={createBatchYear}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: listBatchesQueryKey({ client: apiClient }),
          })
        }}
      />
    </Dialog>
  )
}
