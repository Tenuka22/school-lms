"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import {
  createSiblingMutation,
  listStudentsQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import {
  GenderSchema,
  NationalitySchema,
  ReligionSchema,
  MediumOfInstructionSchema,
} from "@/lib/api-client/schemas.gen"
import { queryClient } from "@/router"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import {
  FormBuilder,
  optionsFromSchema,
  type FormConfig,
} from "@/lib/form-builder"
import {
  IconPlus,
  IconSchool,
} from "@tabler/icons-react"
import type {
  CreateSiblingRequest,
  CreateSiblingResponse,
  StudentDuplicate,
} from "@/lib/api-client/types.gen"

export const siblingFormConfig: FormConfig<CreateSiblingRequest> = {
  fields: [
    { name: "full_name", kind: "text", label: "Full Name", required: true, placeholder: "e.g. John Doe" },
    { name: "name_with_initials", kind: "text", label: "Name with Initials", required: true, placeholder: "e.g. J. Doe" },
    { name: "date_of_birth", kind: "date", label: "Date of Birth", required: true },
    { name: "gender", kind: "select", label: "Gender", required: true, options: optionsFromSchema(GenderSchema) },
    { name: "nationality", kind: "select", label: "Nationality", required: true, options: optionsFromSchema(NationalitySchema) },
    {
      name: "religion",
      kind: "select",
      label: "Religion",
      placeholder: "Select (optional)",
      options: [
        { value: "", label: "None" },
        ...optionsFromSchema(ReligionSchema),
      ],
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
    { name: "medium_of_instruction", kind: "select", label: "Medium", required: true, options: optionsFromSchema(MediumOfInstructionSchema) },
    {
      name: "current_grade",
      kind: "number",
      label: "Enrollment Grade",
      placeholder: "e.g. 1",
      inputProps: { min: 1, max: 13 },
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
    {
      name: "birth_certificate_number",
      kind: "text",
      label: "Birth Certificate No",
      placeholder: "e.g. BC123456",
      section: "optional",
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
    {
      name: "nic",
      kind: "text",
      label: "NIC",
      placeholder: "e.g. 200012345678",
      section: "optional",
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
    {
      name: "passport_number",
      kind: "text",
      label: "Passport No",
      placeholder: "e.g. P1234567",
      section: "optional",
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
    {
      name: "phone",
      kind: "text",
      label: "Phone",
      placeholder: "e.g. +94771234567",
      section: "optional",
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
    {
      name: "email",
      kind: "text",
      label: "Email",
      placeholder: "e.g. john@example.com",
      section: "optional",
      onChangeOverride: (value, handleChange) => {
        handleChange(value === "" ? null : value)
      },
    },
  ],
  layout: [
    { columns: [{ fields: ["full_name"], span: 12 }] },
    { columns: [{ fields: ["name_with_initials"], span: 12 }] },
    {
      columns: [
        { fields: ["date_of_birth"], span: 6 },
        { fields: ["gender"], span: 6 },
      ],
    },
    {
      columns: [
        { fields: ["nationality"], span: 6 },
        { fields: ["religion"], span: 6 },
      ],
    },
    {
      columns: [
        { fields: ["medium_of_instruction"], span: 6 },
        { fields: ["current_grade"], span: 6 },
      ],
    },
    {
      columns: [
        { fields: ["birth_certificate_number"], span: 6 },
        { fields: ["nic"], span: 6 },
      ],
    },
    {
      columns: [
        { fields: ["passport_number"], span: 6 },
        { fields: ["phone"], span: 6 },
      ],
    },
    { columns: [{ fields: ["email"], span: 12 }] },
  ],
  sections: [
    {
      id: "optional",
      title: "Optional Contact & ID Fields",
      collapsible: true,
    },
  ],
  submitLabel: "Create Sibling",
}

export const siblingFormDefaults: CreateSiblingRequest = {
  full_name: "",
  name_with_initials: "",
  date_of_birth: "",
  gender: "Male",
  nationality: "SriLankan",
  religion: null,
  medium_of_instruction: "Sinhala",
  birth_certificate_number: null,
  nic: null,
  passport_number: null,
  phone: null,
  email: null,
  current_grade: null,
  school_id: null,
}

interface CreateSiblingDialogProps {
  enrollmentId: string
  schoolId: string
  onCreated: (studentId: string) => void
}

export function CreateSiblingDialog({
  enrollmentId,
  schoolId,
  onCreated,
}: CreateSiblingDialogProps) {
  const [open, setOpen] = useState(false)
  const [duplicates, setDuplicates] = useState<StudentDuplicate[]>([])

  const createMutation = useMutation({
    ...createSiblingMutation({ client: apiClient }),
    onSuccess: (data: CreateSiblingResponse) => {
      queryClient.invalidateQueries({
        queryKey: listStudentsQueryKey({ client: apiClient }),
        refetchType: "all",
      })
      if (data.created && data.student_id) {
        toast.success("Sibling added")
        onCreated(data.student_id)
        setDuplicates([])
        setOpen(false)
      } else if (data.duplicates.length > 0) {
        setDuplicates(data.duplicates)
      }
    },
    onError: (err) => {
      toastApiError(err, "Failed to create sibling")
    },
  })

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <IconPlus className="mr-1.5 size-4" />
        Create Sibling
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {duplicates.length > 0 ? "Similar Students Found" : "New Sibling"}
            </DialogTitle>
          </DialogHeader>
          {duplicates.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The following students match the details you entered. Select one
                to add as a sibling, or go back to enter different info.
              </p>
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
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
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <IconSchool className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.name_with_initials}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        DOB: {s.date_of_birth} &middot; Gender: {s.gender}{" "}
                        &middot; Grade: {s.current_grade ?? "N/A"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      Select
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDuplicates([])}
              >
                Go back to form
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <FormBuilder<CreateSiblingRequest>
                config={siblingFormConfig}
                defaultValues={siblingFormDefaults}
                onSubmit={async (data) => {
                  setDuplicates([])
                  createMutation.mutate({
                    path: { id: enrollmentId },
                    body: { ...data, school_id: schoolId },
                    client: apiClient,
                  })
                }}
                submitting={createMutation.isPending}
                hideDefaultButtons
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" form="form-builder-form">
                  {createMutation.isPending ? "Creating..." : "Create Sibling"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
