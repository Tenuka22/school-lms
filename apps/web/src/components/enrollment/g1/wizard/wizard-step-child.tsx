"use client"

import { useRef, useState, useEffect } from "react"
import { toastApiError } from "@/lib/api-error"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { IconLoader2, IconCheck } from "@tabler/icons-react"
import { FormBuilder } from "@/lib/form-builder"
import {
  FormUniquenessProvider,
  useUniquenessBlocked,
} from "@/hooks/use-child-uniqueness"
import { makeChildFormConfig } from "@/components/forms/child-form"
import type { ChildFormValues } from "@/components/forms/child-form"

export type ChildFormData = ChildFormValues

interface Props {
  defaultValues: ChildFormData
  onSave: (data: ChildFormData) => Promise<void>
  onNext: () => void
  excludeChildId?: string | null
}

function NextButton({ status }: { status: "idle" | "saving" | "done" }) {
  const { isBlocked } = useUniquenessBlocked()
  return (
    <div className="flex justify-end pt-4">
      <Button
        type="submit"
        form="wizard-step-child-form"
        disabled={status !== "idle" || isBlocked}
      >
        {status === "saving" && (
          <IconLoader2 className="mr-1.5 size-4 animate-spin" />
        )}
        {status === "done" && (
          <IconCheck className="mr-1.5 size-4 text-green-600" />
        )}
        {status === "idle"
          ? "Next"
          : status === "saving"
            ? "Saving\u2026"
            : "Saved"}
      </Button>
    </div>
  )
}

export function WizardStepChild({
  defaultValues,
  onSave,
  onNext,
  excludeChildId,
}: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  const config = makeChildFormConfig({
    excludeChildId,
    useSchemaOptions: true,
    includeEnglishInitials: true,
    includeNicAndPassport: false,
    layout: "wizard",
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Child Profile</CardTitle>
        <CardDescription>
          Enter the child's personal details as per the birth certificate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormUniquenessProvider>
          <FormBuilder<ChildFormData>
            config={config}
            defaultValues={defaultValues}
            onSubmit={async (values) => {
              setStatus("saving")
              try {
                await onSave(values)
                setStatus("done")
                navigateTimer.current = setTimeout(() => onNext(), 400)
              } catch (e) {
                console.error("onSave failed:", e)
                setStatus("idle")
                toastApiError(e, "Failed to save. Please try again.")
              }
            }}
            formId="wizard-step-child-form"
            hideDefaultButtons
          />
          <NextButton status={status} />
        </FormUniquenessProvider>
      </CardContent>
    </Card>
  )
}
