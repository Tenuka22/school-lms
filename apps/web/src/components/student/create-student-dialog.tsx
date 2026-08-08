"use client"

import { useState } from "react"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { EntityDialog } from "@/lib/form-builder"
import { studentFormConfig, studentFormDefaults } from "@/components/forms/student-form"
import type { StudentFormValues } from "@/components/forms/student-form"

type DuplicateChild = {
  id: string
  full_name: string
  name_with_initials: string
  date_of_birth: string
  gender: string
  birth_certificate_number: string | null
  nic: string | null
  nationality: string
  medium_of_instruction: string
}

export function CreateStudentDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [duplicates, setDuplicates] = useState<DuplicateChild[]>([])
  const [showDuplicates, setShowDuplicates] = useState(false)

  const handleSubmit = async (values: StudentFormValues) => {
    const body: Record<string, unknown> = {
      full_name: values.full_name,
      name_with_initials: values.name_with_initials,
      date_of_birth: values.date_of_birth || null,
      gender: values.gender || null,
      nationality: values.nationality || null,
      religion: values.religion || null,
      birth_certificate_number: values.birth_certificate_number || null,
      nic: values.nic || null,
      passport_number: values.passport_number || null,
      medium_of_instruction: values.medium_of_instruction || null,
    }

    const response = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (response.status === 409) {
      const errorData = await response.json()
      if (errorData.duplicates && errorData.duplicates.length > 0) {
        setDuplicates(errorData.duplicates)
        setShowDuplicates(true)
        throw new Error("duplicates_found")
      }
      toast.error(errorData.error || "Duplicate found")
      throw new Error(errorData.error)
    }

    if (!response.ok) {
      const errorData = await response.json()
      toast.error(errorData.error || "Failed to create student")
      throw new Error(errorData.error)
    }

    const result = await response.json()
    toast.success(
      result.used_existing_child
        ? "Student linked to existing child"
        : "Student created successfully"
    )
    setDuplicates([])
    setShowDuplicates(false)
    onSuccess()
    onOpenChange(false)
  }

  const handleUseExistingChild = async (childId: string) => {
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: childId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to link student")
        return
      }

      toast.success("Student linked to existing child")
      setDuplicates([])
      setShowDuplicates(false)
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toastApiError(err, "Failed to link student")
    }
  }

  if (showDuplicates && duplicates.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Matching children found
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              The child data you entered matches existing records. You can link
              to an existing child instead of creating a duplicate.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {duplicates.map((dup) => (
            <div
              key={dup.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex-1">
                <p className="font-medium">{dup.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {dup.name_with_initials} | DOB: {dup.date_of_birth} | {dup.gender}
                </p>
                {dup.birth_certificate_number && (
                  <p className="text-xs text-muted-foreground">BC: {dup.birth_certificate_number}</p>
                )}
                {dup.nic && (
                  <p className="text-xs text-muted-foreground">NIC: {dup.nic}</p>
                )}
              </div>
              <button
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                onClick={() => handleUseExistingChild(dup.id)}
              >
                Use This Child
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="rounded-md border px-3 py-1.5 text-sm"
            onClick={() => {
              setDuplicates([])
              setShowDuplicates(false)
            }}
          >
            Go Back & Edit
          </button>
        </div>
      </div>
    )
  }

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Student"
      description="Enter the child's details to create a new student record. If a matching child already exists, you'll be prompted to link to them instead."
      config={studentFormConfig}
      defaultValues={studentFormDefaults}
      onSubmit={handleSubmit}
      actionLabel="Create Student"
      size="xl"
    />
  )
}
