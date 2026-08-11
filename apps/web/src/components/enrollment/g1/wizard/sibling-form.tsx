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
import { queryClient } from "@/router"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { FormBuilder } from "@/lib/form-builder"
import { siblingFormConfig, siblingFormDefaults } from "@/components/forms/sibling-form"
import {
  IconPlus,
  IconSchool,
} from "@tabler/icons-react"
import type {
  CreateSiblingRequest,
  CreateSiblingResponse,
  SiblingDuplicate,
} from "@/lib/api-client/types.gen"

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
  const [duplicates, setDuplicates] = useState<SiblingDuplicate[]>([])

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
