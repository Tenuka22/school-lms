"use client"

import { useState } from "react"
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
} from "@/components/ui/dialog"
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
import type { Guardian } from "@/lib/api-client/types.gen"
import {
  RELATIONSHIP_OPTIONS,
  CATEGORY_INFO,
  SchoolCombobox,
  StudentCombobox,
  WorkspaceAddressSelect,
} from "./guardian-helpers"

export function EditGuardianDialog({
  guardian,
  open,
  onOpenChange,
  onSaved,
  enrollmentId,
}: {
  guardian: Guardian
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
  enrollmentId?: string
}) {
  const [editing, setEditing] = useState(false)
  const [step, setStep] = useState(1)

  const updateGuardian = useMutation(
    updateGuardianMutation({ client: apiClient })
  )

  const form = useForm({
    defaultValues: {
      full_name: guardian.full_name,
      nic_number: guardian.nic_number,
      contact_phone: guardian.contact_phone,
      contact_email: guardian.contact_email ?? null,
      occupation: guardian.occupation ?? null,
      workplace_name: guardian.workplace_name ?? null,
      workplace_address: guardian.workplace_address ?? null,
      relationship_type: guardian.relationship_type,
      is_school_staff: guardian.is_school_staff,
      staff_type: null,
      employee_id: null,
      staff_school_id: null,
      is_past_pupil: guardian.is_past_pupil,
      is_govt_employee: guardian.is_govt_employee,
      income_level: guardian.income_level ?? null,
      govt_service_years: guardian.govt_service_years ?? null,
      past_pupil_student_id: null,
      past_pupil_highest_grade: null,
      past_pupil_year_left: null,
      past_pupil_left_reason: null,
      past_pupil_school_id: null,
    },
    validators: { onSubmit: vCreateGuardianBody as any },
    onSubmit: async ({ value }) => {
      try {
        setEditing(true)
        const {
          id: _gi,
          created_at: _gc,
          past_pupil_verified: _gp,
          ...guardianBase
        } = guardian
        await updateGuardian.mutateAsync({
          path: { id: guardian.id },
          body: {
            ...guardianBase,
            full_name: value.full_name,
            nic_number: value.nic_number,
            contact_phone: value.contact_phone ?? "0",
            contact_email: value.contact_email ?? null,
            occupation: value.occupation ?? null,
            workplace_name: value.workplace_name ?? null,
            workplace_address: value.workplace_address ?? null,
            relationship_type: value.relationship_type,
            is_school_staff: value.is_school_staff,
            staff_type: value.staff_type,
            employee_id: value.employee_id,
            staff_school_id: value.staff_school_id,
            is_past_pupil: value.is_past_pupil,
            is_govt_employee: value.is_govt_employee,
            income_level: value.income_level,
            govt_service_years: value.govt_service_years,
            past_pupil_student_id: value.past_pupil_student_id,
            past_pupil_highest_grade: value.past_pupil_highest_grade,
            past_pupil_year_left: value.past_pupil_year_left,
            past_pupil_left_reason: value.past_pupil_left_reason,
            past_pupil_school_id: value.past_pupil_school_id,
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
        toast.success(`${value.full_name} updated`)
        onOpenChange(false)
        setStep(1)
        form.reset()
        onSaved()
      } catch (err) {
        toastApiError(err, "Failed to update guardian")
      } finally {
        setEditing(false)
      }
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) {
          setStep(1)
          form.reset()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form
          id="edit-guardian-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (step === 2) {
              form.handleSubmit()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? "Edit Guardian" : "Enrollment Categories"}
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <div className={step === 1 ? "block" : "hidden"}>
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
                          Phone Number
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
                        <Input
                          id={field.name}
                          name={field.name}
                          value={String(field.state.value ?? "")}
                          onBlur={field.handleBlur}
                          onChange={(e) =>
                            field.handleChange(e.target.value || null)
                          }
                          aria-invalid={isInvalid}
                          placeholder="e.g. Teacher"
                        />
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
                  </Field>
                </div>
              </div>
            </div>

            <div className={step === 2 ? "block" : "hidden"}>
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
                              {(form as any).Field({
                                name: "staff_school_id",
                                children: (subField: any) => (
                                  <SchoolCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                ),
                              })}
                              {(form as any).Field({
                                name: "staff_type",
                                children: (subField: any) => (
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
                                ),
                              })}
                              {(form as any).Field({
                                name: "employee_id",
                                children: (subField: any) => (
                                  <Input
                                    placeholder="Employee ID (optional)"
                                    value={String(subField.state.value ?? "")}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        e.target.value || null
                                      )
                                    }
                                  />
                                ),
                              })}
                              {(form as any).Field({
                                name: "occupation",
                                children: (subField: any) => (
                                  <Input
                                    placeholder="Designation (optional)"
                                    value={String(subField.state.value ?? "")}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        e.target.value || null
                                      )
                                    }
                                  />
                                ),
                              })}
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
                              {(form as any).Field({
                                name: "past_pupil_school_id",
                                children: (subField: any) => (
                                  <SchoolCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                ),
                              })}
                              {(form as any).Field({
                                name: "past_pupil_student_id",
                                children: (subField: any) => (
                                  <StudentCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                ),
                              })}
                              <div className="grid grid-cols-2 gap-2">
                                {(form as any).Field({
                                  name: "past_pupil_highest_grade",
                                  children: (subField: any) => (
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
                                  ),
                                })}
                                {(form as any).Field({
                                  name: "past_pupil_left_reason",
                                  children: (subField: any) => (
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
                                  ),
                                })}
                              </div>
                              {(form as any).Field({
                                name: "past_pupil_year_left",
                                children: (subField: any) => (
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
                                ),
                              })}
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
                          onValueChange={(v) => field.handleChange(v ?? null)}
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
            </div>
          </FieldGroup>

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
                  form.reset()
                }}
              >
                Cancel
              </Button>
              {step === 1 ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setStep(2)
                  }}
                >
                  Next <IconChevronRight className="ml-1 size-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={editing}>
                  {editing ? "Saving..." : "Save Guardian"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
