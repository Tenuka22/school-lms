"use client"

import { useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { queryClient } from "@/router"
import {
  updateStudentMutation,
  listStudentsQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { EntityDialog } from "@/lib/form-builder"
import {
  buildStudentEditConfig,
  buildStudentEditDefaults,
} from "@/components/forms/student-form"
import type { StudentEditFormValues } from "@/components/forms/student-form"
import type {
  StudentResponse as Student,
  UpdateStudentRequest,
} from "@/lib/api-client/types.gen"

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
    <EntityDialog<StudentEditFormValues>
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${student.full_name}`}
      config={buildStudentEditConfig()}
      defaultValues={buildStudentEditDefaults(student)}
      onSubmit={async (data) => {
        const cleaned = {
          ...data,
          religion: (data.religion as string) || null,
          birth_certificate_number:
            (data.birth_certificate_number as string) || null,
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
