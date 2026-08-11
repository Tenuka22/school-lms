"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { IconCalendar, IconPlus } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
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
import { optionsFromSchema, useBuildForm, FormBuilder  } from "@/lib/form-builder"
import type { FormConfig } from "@/lib/form-builder"
import {
  GenderSchema,
  NationalitySchema,
  MediumOfInstructionSchema,
  ReligionSchema,
} from "@/lib/api-client/schemas.gen"
import { formatDate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type {
  Child,
  G1Application,
  ApplicationWithChild,
  EnrollmentBatch,
} from "@/lib/api-client/types.gen"
import { CreateBatchDialog } from "@/components/enrollment/g1/create-batch-dialog"
import { FieldWithAlert } from "@/components/enrollment/g1/field-with-alert"
import {
  FormUniquenessProvider,
  useUniquenessBlocked,
} from "@/hooks/use-child-uniqueness"

function getBatchYears(batches?: { year: number }[]): number[] {
  if (!batches) return []
  const years = new Set(batches.map((b) => b.year))
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y <= currentYear + 12; y++) {
    years.add(y)
  }
  return Array.from(years).sort((a, b) => b - a)
}

type EnrollmentFormData = {
  full_name: string
  name_with_initials: string
  date_of_birth: string
  gender: string
  nationality: string
  medium_of_instruction: string
  religion: string | null
  birth_certificate_number: string | null
  passport_number: string | null
  batch_id: string
}

function DatePickerField() {
  const form = useBuildForm()
  return (
    <form.Field
      name="date_of_birth"
      children={(field: any) => {
        const dateValue = field.state.value
          ? new Date(field.state.value + "T12:00:00")
          : undefined
        return (
          <Field data-invalid={false}>
            <FieldLabel htmlFor="date_of_birth">Date of Birth</FieldLabel>
            <Popover>
              <PopoverTrigger
                id="date_of_birth"
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <IconCalendar className="mr-2 size-4 shrink-0" />
                    {dateValue ? (
                      formatDate(dateValue)
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateValue}
                  defaultMonth={dateValue}
                  onSelect={(d: Date | undefined) => {
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
          </Field>
        )
      }}
    />
  )
}

function BatchSelectorField({
  batches,
  onYearChange,
  onCreateBatch,
}: {
  batches?: EnrollmentBatch[]
  onYearChange: (year: number | undefined) => void
  onCreateBatch: (year: number) => void
}) {
  const form = useBuildForm()
  return (
    <form.Field
      name="batch_id"
      children={(field: any) => {
        return (
          <Field data-invalid={false}>
            <FieldLabel htmlFor="batch_id">Batch</FieldLabel>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  name="batch_id"
                  value={field.state.value}
                  onValueChange={(val: string) => {
                    if (val) field.handleChange(val)
                    const batch = batches?.find((b) => b.id === val)
                    if (batch) {
                      onYearChange(batch.year)
                    }
                  }}
                >
                  <SelectTrigger id="batch_id">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {getBatchYears(batches).map((year) => {
                      const yearBatches = (batches ?? []).filter(
                        (b) => b.year === year
                      )
                      return (
                        <div key={year}>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                            {year}
                          </div>
                          {yearBatches.length > 0 ? (
                            yearBatches.map((b: EnrollmentBatch) => (
                              <SelectItem key={b.id} value={b.id!}>
                                {b.batch_name} ({b.status})
                              </SelectItem>
                            ))
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs"
                              onClick={() => onCreateBatch(year)}
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
          </Field>
        )
      }}
    />
  )
}

function EnrollmentSubmitFooter({
  isEdit,
  needsBatch,
  selectedBatchYear,
  setCreateBatchYear,
  setCreateBatchOpen,
}: {
  isEdit: boolean
  needsBatch: boolean
  selectedBatchYear: number | undefined
  setCreateBatchYear: (year: number | undefined) => void
  setCreateBatchOpen: (open: boolean) => void
}) {
  const { isBlocked } = useUniquenessBlocked()
  return (
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
      <Button type="submit" form="enrollment-form" disabled={isBlocked}>
        {isEdit ? "Update" : "Create"}
      </Button>
    </DialogFooter>
  )
}

interface G1EnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrollment?: G1Application | ApplicationWithChild | null
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

  const config: FormConfig<EnrollmentFormData> = {
    fields: [
      {
        name: "full_name",
        kind: "custom",
        label: "Full Name",
        customRenderer: () => (
          <FieldWithAlert
            fieldName="full_name"
            placeholder="John Doe"
            checkType="full_name"
            excludeChildId={childId}
          />
        ),
      },
      {
        name: "name_with_initials",
        kind: "text",
        label: "Name with Initials",
        placeholder: "J. Doe",
      },
      {
        name: "gender",
        kind: "select",
        label: "Gender",
        options: optionsFromSchema(GenderSchema),
      },
      {
        name: "nationality",
        kind: "select",
        label: "Nationality",
        options: optionsFromSchema(NationalitySchema),
      },
      {
        name: "medium_of_instruction",
        kind: "select",
        label: "Medium of Instruction",
        options: optionsFromSchema(MediumOfInstructionSchema),
      },
      {
        name: "religion",
        kind: "select",
        label: "Religion",
        required: true,
        options: optionsFromSchema(ReligionSchema),
      },
      {
        name: "birth_certificate_number",
        kind: "custom",
        label: "Birth Certificate Number",
        required: true,
        customRenderer: () => (
          <FieldWithAlert
            fieldName="birth_certificate_number"
            checkType="birth_certificate_number"
            excludeChildId={childId}
          />
        ),
      },
      {
        name: "passport_number",
        kind: "text",
        label: "Passport Number",
        placeholder: "Optional (for overseas arrivals)",
      },
    ],
    layout: [
      { columns: [{ fields: ["full_name", "name_with_initials"] }] },
      { columns: [{ fields: ["gender", "nationality"] }] },
      { columns: [{ fields: ["medium_of_instruction", "religion"] }] },
      { columns: [{ fields: ["birth_certificate_number"] }] },
      { columns: [{ fields: ["passport_number"] }] },
    ],
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
        <FormUniquenessProvider>
          <FormBuilder<EnrollmentFormData>
            config={config}
            defaultValues={{
              full_name: "",
              name_with_initials: "",
              date_of_birth: "",
              gender: "Male",
              nationality: "SriLankan",
              medium_of_instruction: "Sinhala",
              religion: "Buddhism",
              birth_certificate_number: "",
              passport_number: null,
              batch_id: enrollment?.batch_id ?? "",
            }}
            onSubmit={async (value) => {
              try {
                let savedChildId = childId
                if (!savedChildId) {
                  const childBody = {
                    full_name: value.full_name,
                    name_with_initials: value.name_with_initials,
                    date_of_birth: value.date_of_birth,
                    gender: value.gender as Child["gender"],
                    nationality: value.nationality as Child["nationality"],
                    birth_certificate_number:
                      value.birth_certificate_number || null,
                    medium_of_instruction:
                      value.medium_of_instruction as Child["medium_of_instruction"],
                    religion: value.religion as Child["religion"],
                    nic: null,
                    passport_number: value.passport_number || null,
                    status: "Active" as const,
                  } satisfies Omit<
                    Child,
                    | "id"
                    | "created_at"
                    | "student_id"
                    | "disability_status"
                    | "disability_type"
                    | "photo_url"
                    | "updated_at"
                  >
                  const child = await createChild.mutateAsync({
                    body: childBody,
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
                    gender: value.gender as Child["gender"],
                    nationality: value.nationality as Child["nationality"],
                    medium_of_instruction:
                      value.medium_of_instruction as Child["medium_of_instruction"],
                    religion: value.religion as Child["religion"],
                    nic: null,
                    passport_number: value.passport_number || null,
                    status: "Active",
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
                    declaration_agreed: false,
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
                  toast.success(`${value.full_name}'s enrollment updated`)
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
                    declaration_agreed: false,
                  } satisfies G1Application
                  await createApplication({
                    body: appBody,
                    client: apiClient,
                  })
                  toast.success(`Enrollment created for ${value.full_name}`)
                }
                queryClient.invalidateQueries({
                  queryKey: listApplicationsQueryKey({ client: apiClient }),
                })
                onOpenChange(false)
                onSuccess()
              } catch (err) {
                toastApiError(err, "Operation failed")
              }
            }}
            formId="enrollment-form"
            hideDefaultButtons
          >
            <DatePickerField />
            <BatchSelectorField
              batches={batches}
              onYearChange={setSelectedBatchYear}
              onCreateBatch={(year) => {
                setCreateBatchYear(year)
                setCreateBatchOpen(true)
              }}
            />
          </FormBuilder>
          <EnrollmentSubmitFooter
            isEdit={isEdit}
            needsBatch={needsBatch}
            selectedBatchYear={selectedBatchYear}
            setCreateBatchYear={setCreateBatchYear}
            setCreateBatchOpen={setCreateBatchOpen}
          />
        </FormUniquenessProvider>
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
