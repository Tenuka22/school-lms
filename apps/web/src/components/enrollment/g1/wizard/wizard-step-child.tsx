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
import { FormBuilder, schemaToFormFields } from "@/lib/form-builder"
import { vCreateChildBody } from "@/lib/api-client/valibot.gen"
import type { FormConfig } from "@/lib/form-builder"
import type { Gender, Nationality, MediumOfInstruction, Religion } from "@/lib/api-client/types.gen"

export type ChildFormData = {
  full_name: string
  name_with_initials: string
  name_with_initials_en: string
  date_of_birth: string
  gender: Gender
  nationality: Nationality
  religion: Religion | undefined
  birth_certificate_number: string
  medium_of_instruction: MediumOfInstruction
}

interface Props {
  defaultValues: ChildFormData
  onSave: (data: ChildFormData) => Promise<void>
  onNext: () => void
}

const CIRCULAR_CHILD_FIELDS: (keyof ChildFormData)[] = [
  "full_name",
  "name_with_initials",
  "name_with_initials_en",
  "date_of_birth",
  "gender",
  "nationality",
  "religion",
  "birth_certificate_number",
  "medium_of_instruction",
]

export function WizardStepChild({ defaultValues, onSave, onNext }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  const fields = schemaToFormFields({
    schema: vCreateChildBody as any,
    include: CIRCULAR_CHILD_FIELDS as any,
    overrides: {
      name_with_initials_en: { placeholder: "e.g. B.S.S. Peiris" },
      birth_certificate_number: { required: true, placeholder: "Enter birth certificate number" },
      religion: { required: true },
      nationality: { required: true },
      medium_of_instruction: { required: true },
    },
  })

  const layout = [
    { columns: [{ fields: ["full_name", "name_with_initials"] }] },
    { columns: [{ fields: ["name_with_initials_en"] }] },
    { columns: [{ fields: ["date_of_birth"] }] },
    { columns: [{ fields: ["gender", "nationality", "religion"] }] },
    { columns: [{ fields: ["birth_certificate_number"] }] },
    { columns: [{ fields: ["medium_of_instruction"] }] },
  ]

  const config: FormConfig<ChildFormData> = { fields, layout }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Child Profile</CardTitle>
        <CardDescription>
          Enter the child's personal details as per the birth certificate.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
        <div className="flex justify-end pt-4">
          <Button type="submit" form="wizard-step-child-form" disabled={status !== "idle"}>
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
      </CardContent>
    </Card>
  )
}
