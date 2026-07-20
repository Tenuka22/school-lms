"use client"

import { useState, useMemo, useCallback } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { apiClient } from "@/lib/api-client"
import { listStudentsOptions, listStudentsQueryKey, createSiblingMutation, updateStudentMutation } from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import { cn } from "@/lib/utils"
import { IconChevronLeft, IconChevronRight, IconPlus, IconSearch, IconCheck, IconSchool, IconGripVertical, IconCalendar, IconPencil } from "@tabler/icons-react"
import type { CreateSiblingRequest, CreateSiblingResponse, StudentDuplicate, Gender, Nationality, Religion, MediumOfInstruction, Student } from "@/lib/api-client/types.gen"
import { useDebounce } from "@/hooks/use-debounce"

const PAGE_SIZE = 8

interface CreateSiblingDialogProps {
  enrollmentId: string
  schoolId: string
  onCreated: (studentId: string) => void
}

function CreateSiblingDialog({ enrollmentId, schoolId, onCreated }: CreateSiblingDialogProps) {
  const [open, setOpen] = useState(false)
  const [duplicates, setDuplicates] = useState<StudentDuplicate[]>([])

  const createMutation = useMutation({
    ...createSiblingMutation({ client: apiClient }),
    onSuccess: (data: CreateSiblingResponse) => {
      queryClient.invalidateQueries({ queryKey: listStudentsQueryKey({ client: apiClient }) })
      if (data.created && data.student_id) {
        onCreated(data.student_id)
        setDuplicates([])
        setOpen(false)
      } else if (data.duplicates.length > 0) {
        setDuplicates(data.duplicates)
      }
    },
  })

  return (
    <>
      <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
        <IconPlus className="size-4 mr-1.5" />
        Create Sibling
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{duplicates.length > 0 ? "Similar Students Found" : "New Sibling"}</DialogTitle>
          </DialogHeader>
          {duplicates.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The following students match the details you entered. Select one to add as a sibling, or go back to enter different info.
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {duplicates.map((s) => (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onCreated(s.id)
                      setDuplicates([])
                      setOpen(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onCreated(s.id)
                        setDuplicates([])
                        setOpen(false)
                      }
                    }}
                    className="flex items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent cursor-pointer"
                  >
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <IconSchool className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.name_with_initials}</p>
                      <p className="text-xs text-muted-foreground">
                        DOB: {s.date_of_birth} &middot; Gender: {s.gender} &middot; Grade: {s.current_grade ?? "N/A"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">Select</Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full" onClick={() => setDuplicates([])}>
                Go back to form
              </Button>
            </div>
          ) : (
            <CreateSiblingForm
              onSubmit={(data) => {
                setDuplicates([])
                createMutation.mutate({ path: { id: enrollmentId }, body: { ...data, school_id: schoolId }, client: apiClient })
              }}
              onCancel={() => { setDuplicates([]); setOpen(false) }}
              isPending={createMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

const siblingFormDefaults: CreateSiblingRequest = {
  full_name: "",
  name_with_initials: "",
  date_of_birth: "",
  gender: "Male" as Gender,
  nationality: "SriLankan" as Nationality,
  religion: null,
  medium_of_instruction: "Sinhala" as MediumOfInstruction,
  birth_certificate_number: null,
  nic: null,
  passport_number: null,
  phone: null,
  email: null,
  current_grade: null,
  school_id: null,
}

function CreateSiblingForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (data: CreateSiblingRequest) => void
  onCancel: () => void
  isPending: boolean
}) {
  const form = useForm({
    defaultValues: siblingFormDefaults,
    onSubmit: async ({ value }) => {
      onSubmit({
        full_name: value.full_name,
        name_with_initials: value.name_with_initials,
        date_of_birth: value.date_of_birth,
        gender: value.gender,
        nationality: value.nationality,
        religion: value.religion || null,
        medium_of_instruction: value.medium_of_instruction,
        birth_certificate_number: value.birth_certificate_number || null,
        nic: value.nic || null,
        passport_number: value.passport_number || null,
        phone: value.phone || null,
        email: value.email || null,
        current_grade: value.current_grade ?? null,
        school_id: null,
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <form.Field
            name="full_name"
            validators={{
              onChange: ({ value }) => (!value ? "Name is required" : undefined),
            }}
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid} className="col-span-2">
                  <FieldLabel htmlFor={field.name}>Full Name <span className="text-destructive">*</span></FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. John Doe"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="name_with_initials"
            validators={{
              onChange: ({ value }) => (!value ? "Name with initials is required" : undefined),
            }}
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid} className="col-span-2">
                  <FieldLabel htmlFor={field.name}>Name with Initials <span className="text-destructive">*</span></FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. J. Doe"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="date_of_birth"
            validators={{
              onChange: ({ value }) => (!value ? "Date of birth is required" : undefined),
            }}
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              const dateVal = field.state.value ? new Date(field.state.value + "T00:00:00") : undefined
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Date of Birth <span className="text-destructive">*</span></FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id={field.name}
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.state.value && "text-muted-foreground"
                        )}
                        aria-invalid={isInvalid}
                      >
                        <IconCalendar className="size-4 mr-2 shrink-0" />
                        {field.state.value
                          ? new Date(field.state.value + "T00:00:00").toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        captionLayout="dropdown"
                        buttonVariant="ghost"
                        mode="single"
                        selected={dateVal}
                        onSelect={(d) => {
                          if (d) {
                            const y = d.getFullYear()
                            const m = String(d.getMonth() + 1).padStart(2, "0")
                            const day = String(d.getDate()).padStart(2, "0")
                            field.handleChange(`${y}-${m}-${day}`)
                          }
                        }}
                        startMonth={new Date(1990, 0)}
                        endMonth={new Date(2026, 11)}
                        disabled={(d) => d > new Date() || d < new Date(1950, 0, 1)}
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
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Gender <span className="text-destructive">*</span></FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as Gender)}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <form.Field
            name="nationality"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Nationality <span className="text-destructive">*</span></FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as Nationality)}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SriLankan">Sri Lankan</SelectItem>
                    <SelectItem value="DualCitizen">Dual Citizen</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <form.Field
            name="religion"
            children={(field) => {
              const val = field.state.value
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>Religion</FieldLabel>
                  <Select
                    value={val ?? ""}
                    onValueChange={(v) => field.handleChange(v ? v as Religion : null)}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buddhism">Buddhism</SelectItem>
                      <SelectItem value="Hinduism">Hinduism</SelectItem>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Christianity">Christianity</SelectItem>
                      <SelectItem value="Catholicism">Catholicism</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )
            }}
          />
          <form.Field
            name="medium_of_instruction"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Medium <span className="text-destructive">*</span></FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as MediumOfInstruction)}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sinhala">Sinhala</SelectItem>
                    <SelectItem value="Tamil">Tamil</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <form.Field
            name="current_grade"
            children={(field) => {
              const val = field.state.value
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>Enrollment Grade</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={1}
                    max={13}
                    value={val ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null)}
                    placeholder="e.g. 1"
                  />
                </Field>
              )
            }}
          />
        </div>

        <div className="border-t pt-3 mt-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">Optional Contact &amp; ID Fields</p>
          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="birth_certificate_number"
              children={(field) => {
                const val = field.state.value
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Birth Certificate No</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={val ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="e.g. BC123456"
                    />
                  </Field>
                )
              }}
            />
            <form.Field
              name="nic"
              children={(field) => {
                const val = field.state.value
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>NIC</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={val ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="e.g. 200012345678"
                    />
                  </Field>
                )
              }}
            />
            <form.Field
              name="passport_number"
              children={(field) => {
                const val = field.state.value
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Passport No</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={val ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="e.g. P1234567"
                    />
                  </Field>
                )
              }}
            />
            <form.Field
              name="phone"
              children={(field) => {
                const val = field.state.value
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={val ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="e.g. +94771234567"
                    />
                  </Field>
                )
              }}
            />
            <form.Field
              name="email"
              children={(field) => {
                const val = field.state.value
                return (
                  <Field className="col-span-2">
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={val ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      placeholder="e.g. john@example.com"
                    />
                  </Field>
                )
              }}
            />
          </div>
        </div>
      </FieldGroup>
      <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Create Sibling"}
        </Button>
      </div>
    </form>
  )
}

interface EditStudentDialogProps {
  student: Student
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EditStudentDialog({ student, open, onOpenChange }: EditStudentDialogProps) {
  const updateMutation = useMutation({
    ...updateStudentMutation({ client: apiClient }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listStudentsQueryKey({ client: apiClient }) })
      onOpenChange(false)
    },
  })

  const form = useForm({
    defaultValues: {
      full_name: student.full_name,
      name_with_initials: student.name_with_initials,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      nationality: student.nationality,
      religion: student.religion ?? null,
      medium_of_instruction: student.medium_of_instruction,
      birth_certificate_number: student.birth_certificate_number ?? null,
      nic: student.nic ?? null,
      passport_number: student.passport_number ?? null,
      phone: student.phone ?? null,
      email: student.email ?? null,
      current_grade: student.current_grade ?? null,
    },
    onSubmit: async ({ value }) => {
      updateMutation.mutate({
        path: { id: student.id },
        body: {
          full_name: value.full_name,
          name_with_initials: value.name_with_initials,
          date_of_birth: value.date_of_birth,
          gender: value.gender,
          nationality: value.nationality,
          religion: value.religion ?? null,
          medium_of_instruction: value.medium_of_instruction,
          birth_certificate_number: value.birth_certificate_number ?? null,
          nic: value.nic ?? null,
          passport_number: value.passport_number ?? null,
          phone: value.phone ?? null,
          email: value.email ?? null,
          current_grade: value.current_grade ?? null,
        },
        client: apiClient,
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {student.full_name}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="full_name"
                validators={{
                  onChange: ({ value }) => (!value ? "Name is required" : undefined),
                }}
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="col-span-2">
                      <FieldLabel htmlFor={field.name}>Full Name <span className="text-destructive">*</span></FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
              <form.Field
                name="name_with_initials"
                validators={{
                  onChange: ({ value }) => (!value ? "Name with initials is required" : undefined),
                }}
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="col-span-2">
                      <FieldLabel htmlFor={field.name}>Name with Initials <span className="text-destructive">*</span></FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
              <form.Field
                name="date_of_birth"
                validators={{
                  onChange: ({ value }) => (!value ? "Date of birth is required" : undefined),
                }}
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              const dateVal = field.state.value ? new Date(field.state.value + "T12:00:00") : undefined
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Date of Birth <span className="text-destructive">*</span></FieldLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id={field.name}
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.state.value && "text-muted-foreground"
                            )}
                            aria-invalid={isInvalid}
                          >
                            <IconCalendar className="size-4 mr-2 shrink-0" />
                            {field.state.value
                              ? new Date(field.state.value + "T00:00:00").toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            captionLayout="dropdown"
                            buttonVariant="ghost"
                            mode="single"
                            selected={dateVal}
                            onSelect={(d) => {
                              if (d) {
                                const y = d.getFullYear()
                                const m = String(d.getMonth() + 1).padStart(2, "0")
                                const day = String(d.getDate()).padStart(2, "0")
                                field.handleChange(`${y}-${m}-${day}`)
                              }
                            }}
                            startMonth={new Date(1990, 0)}
                            endMonth={new Date(2026, 11)}
                            disabled={(d) => d > new Date() || d < new Date(1950, 0, 1)}
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
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Gender <span className="text-destructive">*</span></FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as Gender)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <form.Field
                name="nationality"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Nationality <span className="text-destructive">*</span></FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as Nationality)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SriLankan">Sri Lankan</SelectItem>
                        <SelectItem value="DualCitizen">Dual Citizen</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <form.Field
                name="religion"
                children={(field) => {
                  const val = field.state.value
                  return (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Religion</FieldLabel>
                      <Select
                        value={val ?? ""}
                        onValueChange={(v) => field.handleChange(v ? v as Religion : null)}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder="Select (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Buddhism">Buddhism</SelectItem>
                          <SelectItem value="Hinduism">Hinduism</SelectItem>
                          <SelectItem value="Islam">Islam</SelectItem>
                          <SelectItem value="Christianity">Christianity</SelectItem>
                          <SelectItem value="Catholicism">Catholicism</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )
                }}
              />
              <form.Field
                name="medium_of_instruction"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Medium <span className="text-destructive">*</span></FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as MediumOfInstruction)}
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sinhala">Sinhala</SelectItem>
                        <SelectItem value="Tamil">Tamil</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <form.Field
                name="current_grade"
                children={(field) => {
                  const val = field.state.value
                  return (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Enrollment Grade</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min={1}
                        max={13}
                        value={val ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null)}
                        placeholder="e.g. 1"
                      />
                    </Field>
                  )
                }}
              />
            </div>

            <div className="border-t pt-3 mt-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Optional Contact &amp; ID Fields</p>
              <div className="grid grid-cols-2 gap-3">
                <form.Field
                  name="birth_certificate_number"
                  children={(field) => {
                    const val = field.state.value
                    return (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Birth Certificate No</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={val ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value || null)}
                          placeholder="e.g. BC123456"
                        />
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="nic"
                  children={(field) => {
                    const val = field.state.value
                    return (
                      <Field>
                        <FieldLabel htmlFor={field.name}>NIC</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={val ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value || null)}
                          placeholder="e.g. 200012345678"
                        />
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="passport_number"
                  children={(field) => {
                    const val = field.state.value
                    return (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Passport No</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={val ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value || null)}
                          placeholder="e.g. P1234567"
                        />
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="phone"
                  children={(field) => {
                    const val = field.state.value
                    return (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={val ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value || null)}
                          placeholder="e.g. +94771234567"
                        />
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="email"
                  children={(field) => {
                    const val = field.state.value
                    return (
                      <Field className="col-span-2">
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={val ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value || null)}
                          placeholder="e.g. john@example.com"
                        />
                      </Field>
                    )
                  }}
                />
              </div>
            </div>
          </FieldGroup>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface SiblingSelectorProps {
  enrollmentId: string
  schoolId: string
  selectedStudentIds: string[]
  onSelect: (id: string) => void
  onDeselect: (id: string) => void
}

export function SiblingSelector({ enrollmentId, schoolId, selectedStudentIds, onSelect, onDeselect }: SiblingSelectorProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const debouncedSearch = useDebounce(search, 300)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  const { data: students = [] } = useQuery(
    listStudentsOptions({ client: apiClient, query: { search: debouncedSearch || undefined } }),
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.admission_number ?? "").toLowerCase().includes(q) ||
        s.name_with_initials.toLowerCase().includes(q),
    )
  }, [students, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const handlePageChange = (p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)))
  }

  const handleCreated = useCallback((studentId: string) => {
    onSelect(studentId)
    setPage(0)
  }, [onSelect])

  return (
    <div className="space-y-3">
      <div className="relative">
        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, admission no..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="pl-9"
        />
      </div>

      <CreateSiblingDialog enrollmentId={enrollmentId} schoolId={schoolId} onCreated={handleCreated} />

      <p className="text-xs text-muted-foreground">
        Select students currently enrolled at this school as siblings.
      </p>

      <ScrollArea className="h-[360px] pr-2">
        <div className="space-y-1">
          {paged.map((s) => {
            const isSelected = selectedStudentIds.includes(s.id)
            const displayGrade = s.current_grade ?? "N/A"
            return (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => isSelected ? onDeselect(s.id) : onSelect(s.id)}
                onKeyDown={(e) => { if (e.key === "Enter") isSelected ? onDeselect(s.id) : onSelect(s.id) }}
                className={cn(
                  "w-full flex items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent cursor-pointer group",
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{s.full_name}</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => { e.stopPropagation(); setEditingStudent(s) }}
                      aria-label={`Edit ${s.full_name}`}
                      className="size-6 shrink-0 -mr-1"
                    >
                      <IconPencil className="size-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{s.name_with_initials}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <IconGripVertical className="size-3 shrink-0" />
                    <span>Enrollment Grade: {displayGrade}</span>
                    {s.admission_number && (
                      <>
                        <span className="text-muted-foreground/40">&middot;</span>
                        <span>{s.admission_number}</span>
                      </>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                    <IconCheck className="size-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            )
          })}
          {paged.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? "No students found" : "No students available."}
            </p>
          )}
        </div>
      </ScrollArea>

      {editingStudent && (
        <EditStudentDialog
          student={editingStudent}
          open={true}
          onOpenChange={(o) => { if (!o) setEditingStudent(null) }}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" disabled={safePage === 0} onClick={() => handlePageChange(safePage - 1)}>
            <IconChevronLeft className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {safePage + 1} / {totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={safePage >= totalPages - 1} onClick={() => handlePageChange(safePage + 1)}>
            <IconChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
