"use client"

import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { queryClient } from "@/router"
import {
  updateStudentMutation,
  listStudentsQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import {
  GenderSchema,
  NationalitySchema,
  ReligionSchema,
  MediumOfInstructionSchema,
} from "@/lib/api-client/schemas.gen"
import { EntityDialog, optionsFromSchema, type FormConfig } from "@/lib/form-builder"
import type { Student, UpdateStudentRequest } from "@/lib/api-client/types.gen"

type EditStudentFormData = UpdateStudentRequest

function buildEditConfig(): FormConfig<EditStudentFormData> {
  return {
    fields: [
      { name: "full_name", kind: "text", label: "Full Name", required: true },
      { name: "name_with_initials", kind: "text", label: "Name with Initials", required: true },
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
  }
}

function buildEditDefaults(student: Student): EditStudentFormData {
  return {
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
  }
}

interface EditStudentDialogProps {
  student: Student
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditStudentDialog({
  student,
  open,
  onOpenChange,
}: EditStudentDialogProps) {
  const updateMutation = useMutation({
    ...updateStudentMutation({ client: apiClient }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listStudentsQueryKey({ client: apiClient }),
      })
      onOpenChange(false)
    },
  })

  return (
    <EntityDialog<EditStudentFormData>
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${student.full_name}`}
      config={buildEditConfig()}
      defaultValues={buildEditDefaults(student)}
      onSubmit={async (data) => {
        const cleaned = {
          ...data,
          religion: (data.religion as string) || null,
          birth_certificate_number: (data.birth_certificate_number as string) || null,
          nic: (data.nic as string) || null,
          passport_number: (data.passport_number as string) || null,
          phone: (data.phone as string) || null,
          email: (data.email as string) || null,
          current_grade: (data.current_grade as number) ?? null,
        }
        updateMutation.mutate({
          path: { id: student.id },
          body: cleaned as UpdateStudentRequest,
          client: apiClient,
        })
      }}
      submitting={updateMutation.isPending}
      actionLabel="Save"
      size="md"
    />
  )
}

