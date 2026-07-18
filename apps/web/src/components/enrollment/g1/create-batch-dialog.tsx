"use client"

import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { createBatch } from "@/lib/api-client/sdk.gen"
import { vCreateBatchBody } from "@/lib/api-client/valibot.gen"
import type { EnrollmentBatch } from "@/lib/api-client/types.gen"
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

interface CreateBatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (batch: EnrollmentBatch) => void
  defaultYear?: number
}

export function CreateBatchDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultYear,
}: CreateBatchDialogProps) {
  const form = useForm({
    defaultValues: {
      year: defaultYear ?? new Date().getFullYear(),
      enrollment_type: "G1" as const,
    },
    validators: {
      onSubmit: vCreateBatchBody,
    },
    onSubmit: async ({ value }) => {
      try {
        const { data } = await createBatch({
          body: value,
          client: apiClient,
        })
        toast.success("Batch created")
        form.reset()
        onOpenChange(false)
        if (data) onSuccess(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create batch"
        toast.error(message)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Batch</DialogTitle>
          <DialogDescription>
            Create a new G1 enrollment batch for a specific year.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-batch-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="year"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Year</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                      aria-invalid={isInvalid}
                      placeholder="2026"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <input type="hidden" name="enrollment_type" value="G1" />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-batch-form">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
