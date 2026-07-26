"use client"

import { useState, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxInput,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import {
  createGuardianMutation,
  getApplicationGuardiansQueryKey,
  listGuardiansQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import { vCreateGuardianBody } from "@/lib/api-client/valibot.gen"
import { IconPlus } from "@tabler/icons-react"
import type { CreateGuardianBody } from "@/lib/api-client/types.gen"
import professions from "professions"
import {
  RELATIONSHIP_OPTIONS,
  CATEGORY_INFO,
  SchoolCombobox,
  StudentCombobox,
  WorkspaceAddressSelect,
} from "./guardian-helpers"

const defaultValues: CreateGuardianBody & {
  past_pupil_highest_grade: string | null
  past_pupil_year_left: number | null
  past_pupil_left_reason: string | null
  staff_school_id: string | null
  past_pupil_school_id: string | null
} = {
  full_name: "",
  nic_number: "",
  contact_phone: "",
  contact_email: null,
  occupation: null,
  workplace_name: null,
  workplace_address: null,
  relationship_type: "Guardian",
  is_school_staff: false,
  staff_type: null,
  employee_id: null,
  staff_school_id: null,
  is_past_pupil: false,
  is_govt_employee: false,
  income_level: null,
  govt_service_years: null,
  past_pupil_student_id: null,
  past_pupil_highest_grade: null,
  past_pupil_year_left: null,
  past_pupil_left_reason: null,
  past_pupil_school_id: null,
}

export function CreateGuardianDialog({ enrollmentId, onCreated }: { enrollmentId?: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const stepRef = useRef(step)
  stepRef.current = step

  const createGuardian = useMutation(
    createGuardianMutation({ client: apiClient })
  )

  const form = useForm({
    defaultValues,
    validators: { onSubmit: vCreateGuardianBody as any },
    onSubmit: async ({ value }) => {
      if (stepRef.current === 1) {
        setStep(2)
        return
      }
      try {
        await createGuardian.mutateAsync({
          body: value,
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
        toast.success(`${value.full_name} created`)
        setOpen(false)
        setStep(1)
        form.reset()
        onCreated()
      } catch (err) {
        toastApiError(err, "Failed to create guardian")
      }
    },
  })

  const handleClose = () => {
    setOpen(false)
    setStep(1)
    form.reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setStep(1)
          form.reset()
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
      <DialogContent className="sm:max-w-lg">
        <form
          id="create-guardian-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "Guardian Details" : "Enrollment Categories"}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            {step === 1 && (
              <div className="grid max-h-[55vh] grid-cols-2 gap-x-4 gap-y-4 overflow-y-auto pr-1">
                <div className="col-span-2">
                  <form.Field
                    name="relationship_type"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Relationship{" "}
                            <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Select
                            name={field.name}
                            value={field.state.value}
                            onValueChange={(v) => field.handleChange(v ?? "")}
                          >
                            <SelectTrigger
                              id={field.name}
                              aria-invalid={isInvalid}
                              className="w-full"
                            >
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_OPTIONS.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldDescription>
                            Guardian&apos;s relationship to the applicant.
                          </FieldDescription>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <form.Field
                    name="full_name"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>
                            Full Name{" "}
                            <span className="text-destructive">*</span>
                          </FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="e.g. John Doe"
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />
                </div>
                <form.Field
                  name="nic_number"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          NIC Number <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="e.g. 952312345V"
                        />
                        <FieldDescription>
                          National Identity Card number.
                        </FieldDescription>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="contact_phone"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Phone Number <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="e.g. +94 77 123 4567"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="contact_email"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Email Address
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={String(field.state.value ?? "")}
                          onBlur={field.handleBlur}
                          onChange={(e) =>
                            field.handleChange(e.target.value || null)
                          }
                          aria-invalid={isInvalid}
                          placeholder="e.g. john@example.com"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="occupation"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Occupation</FieldLabel>
                        <Combobox
                          items={professions}
                          value={String(field.state.value ?? "")}
                          onValueChange={(v) => field.handleChange(v || null)}
                        >
                          <ComboboxInput
                            id={field.name}
                            placeholder="Search or type occupation..."
                            showClear
                            aria-invalid={isInvalid ? true : undefined}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>
                              No matching title. Type your own.
                            </ComboboxEmpty>
                            <ComboboxList>
                              {(item) => (
                                <ComboboxItem key={item} value={item}>
                                  {item}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        <FieldDescription>
                          Current occupation or job title.
                        </FieldDescription>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
                <div className="col-span-2">
                  <Field>
                    <FieldLabel>Workspace</FieldLabel>
                    <WorkspaceAddressSelect
                      onChange={(name, address) => {
                        form.setFieldValue("workplace_name", name)
                        form.setFieldValue("workplace_address", address)
                      }}
                    />
                    <FieldDescription>
                      Search for an existing workspace address or type a new
                      one.
                    </FieldDescription>
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                <p className="text-xs text-muted-foreground">
                  Select categories that apply to this guardian. These affect
                  enrollment scoring weight.
                </p>
                {CATEGORY_INFO.map((cat) => (
                  <form.Field
                    key={cat.key}
                    name={cat.key}
                    children={(field: any) => {
                      const checked = field.state.value
                      return (
                        <div
                          className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                            checked
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-accent/50"
                          }`}
                          onClick={(e) => {
                            const target = e.target as HTMLElement
                            if (
                              target.closest(
                                '[role="option"], [role="combobox"], [role="listbox"], input, select, button'
                              )
                            )
                              return
                            field.handleChange(!checked)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={field.name}
                                name={field.name}
                                checked={checked}
                                onCheckedChange={(v) =>
                                  field.handleChange(v === true)
                                }
                              />
                              <span className="text-sm font-medium">
                                {cat.label}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              +{cat.weight}
                            </Badge>
                          </div>
                          <p className="mt-1 ml-7 text-xs text-muted-foreground">
                            {cat.desc}
                          </p>
                          {cat.key === "is_school_staff" && checked && (
                            <div className="mt-2 ml-7 space-y-2">
                              <form.Field
                                name="staff_school_id"
                                children={(subField: any) => (
                                  <SchoolCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                )}
                              />
                              <form.Field
                                name="staff_type"
                                children={(subField: any) => (
                                  <Select
                                    name={subField.name}
                                    value={String(subField.state.value ?? "")}
                                    onValueChange={(v) =>
                                      subField.handleChange(v || null)
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Staff type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Teacher">
                                        Teacher
                                      </SelectItem>
                                      <SelectItem value="Admin">
                                        Admin
                                      </SelectItem>
                                      <SelectItem value="Worker">
                                        Worker
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              <form.Field
                                name="employee_id"
                                children={(subField: any) => (
                                  <Input
                                    placeholder="Employee ID (optional)"
                                    value={String(subField.state.value ?? "")}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        e.target.value || null
                                      )
                                    }
                                  />
                                )}
                              />
                              <form.Field
                                name="occupation"
                                children={(subField: any) => (
                                  <Input
                                    placeholder="Designation (optional)"
                                    value={String(subField.state.value ?? "")}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        e.target.value || null
                                      )
                                    }
                                  />
                                )}
                              />
                            </div>
                          )}
                          {cat.key === "is_govt_employee" && checked && (
                            <div className="mt-2 ml-7">
                              <form.Field
                                name="govt_service_years"
                                children={(subField: any) => (
                                  <Input
                                    placeholder="Years of government service"
                                    type="number"
                                    value={subField.state.value ?? ""}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        e.target.value
                                          ? Number(e.target.value)
                                          : null
                                      )
                                    }
                                  />
                                )}
                              />
                            </div>
                          )}
                          {cat.key === "is_past_pupil" && checked && (
                            <div className="mt-2 ml-7 space-y-2">
                              <form.Field
                                name="past_pupil_school_id"
                                children={(subField: any) => (
                                  <SchoolCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                )}
                              />
                              <form.Field
                                name="past_pupil_student_id"
                                children={(subField: any) => (
                                  <StudentCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                )}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <form.Field
                                  name="past_pupil_highest_grade"
                                  children={(subField: any) => (
                                    <Select
                                      name={subField.name}
                                      value={String(subField.state.value ?? "")}
                                      onValueChange={(v) =>
                                        subField.handleChange(v || null)
                                      }
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Highest grade" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="GCE_AL">
                                          GCE A/L
                                        </SelectItem>
                                        <SelectItem value="GCE_OL">
                                          GCE O/L
                                        </SelectItem>
                                        <SelectItem value="Grade_11">
                                          Grade 11
                                        </SelectItem>
                                        <SelectItem value="Grade_10">
                                          Grade 10
                                        </SelectItem>
                                        <SelectItem value="Below_Grade_10">
                                          Below Grade 10
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                                <form.Field
                                  name="past_pupil_left_reason"
                                  children={(subField: any) => (
                                    <Select
                                      name={subField.name}
                                      value={String(subField.state.value ?? "")}
                                      onValueChange={(v) =>
                                        subField.handleChange(v || null)
                                      }
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Reason" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Completed">
                                          Completed
                                        </SelectItem>
                                        <SelectItem value="Transferred">
                                          Transferred
                                        </SelectItem>
                                        <SelectItem value="Other">
                                          Other
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                              <form.Field
                                name="past_pupil_year_left"
                                children={(subField: any) => (
                                  <Input
                                    placeholder="Year left school (e.g. 2015)"
                                    type="number"
                                    value={subField.state.value ?? ""}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        e.target.value
                                          ? Number(e.target.value)
                                          : null
                                      )
                                    }
                                  />
                                )}
                              />
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                ))}
                <form.Field
                  name="income_level"
                  children={(field: any) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel>Monthly Income (LKR)</FieldLabel>
                        <Select
                          name={field.name}
                          value={String(field.state.value ?? "")}
                          onValueChange={(v) =>
                            (field as any).handleChange(v ?? null)
                          }
                        >
                          <SelectTrigger aria-invalid={isInvalid}>
                            <SelectValue placeholder="Select income range (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="below_25000">
                              Below 25,000
                            </SelectItem>
                            <SelectItem value="25000_50000">
                              25,000 – 50,000
                            </SelectItem>
                            <SelectItem value="50000_100000">
                              50,000 – 100,000
                            </SelectItem>
                            <SelectItem value="100000_200000">
                              100,000 – 200,000
                            </SelectItem>
                            <SelectItem value="200000_500000">
                              200,000 – 500,000
                            </SelectItem>
                            <SelectItem value="above_500000">
                              Above 500,000
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
              </div>
            )}
          </FieldGroup>

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
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {step === 1 ? (
                <Button type="submit">Next &rarr;</Button>
              ) : (
                <Button type="submit">Save Guardian</Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
