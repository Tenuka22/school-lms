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
import { FormBuilder, optionsFromSchema } from "@/lib/form-builder"
import { FieldWithAlert } from "@/components/enrollment/g1/field-with-alert"
import {
  FormUniquenessProvider,
  useUniquenessBlocked,
} from "@/hooks/use-child-uniqueness"
import {
  GenderSchema,
  NationalitySchema,
  MediumOfInstructionSchema,
  ReligionSchema,
} from "@/lib/api-client/schemas.gen"
import type { FormConfig } from "@/lib/form-builder"
import type {
  Gender,
  Nationality,
  MediumOfInstruction,
  Religion,
} from "@/lib/api-client/types.gen"

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
  excludeChildId?: string | null
}

function makeConfig(excludeChildId?: string | null): FormConfig<ChildFormData> {
  return {
    fields: [
      {
        name: "full_name",
        kind: "custom",
        label: "Full Name",
        required: true,
        customRenderer: () => (
          <FieldWithAlert
            fieldName="full_name"
            placeholder="Enter full name"
            checkType="full_name"
            excludeChildId={excludeChildId}
          />
        ),
      },
      {
        name: "name_with_initials",
        kind: "text",
        label: "Name with Initials",
        placeholder: "e.g. J. M. Perera",
      },
      {
        name: "name_with_initials_en",
        kind: "text",
        label: "Name with Initials (English)",
        placeholder: "e.g. B.S.S. Peiris",
      },
      { name: "date_of_birth", kind: "date", label: "Date of Birth" },
      {
        name: "gender",
        kind: "select",
        label: "Gender",
        required: true,
        options: optionsFromSchema(GenderSchema),
        inputProps: { placeholder: "Select gender" },
      },
      {
        name: "nationality",
        kind: "select",
        label: "Nationality",
        required: true,
        options: optionsFromSchema(NationalitySchema),
        inputProps: { placeholder: "Select nationality" },
      },
      {
        name: "religion",
        kind: "select",
        label: "Religion",
        required: true,
        options: optionsFromSchema(ReligionSchema),
        inputProps: { placeholder: "Select religion" },
      },
      {
        name: "birth_certificate_number",
        kind: "custom",
        label: "Birth Certificate Number",
        required: true,
        customRenderer: () => (
          <FieldWithAlert
            fieldName="birth_certificate_number"
            placeholder="Enter birth certificate number"
            checkType="birth_certificate_number"
            excludeChildId={excludeChildId}
          />
        ),
      },
      {
        name: "medium_of_instruction",
        kind: "select",
        label: "Medium of Instruction",
        required: true,
        options: optionsFromSchema(MediumOfInstructionSchema),
        inputProps: { placeholder: "Select medium" },
      },
    ],
    layout: [
      { columns: [{ fields: ["full_name", "name_with_initials"] }] },
      { columns: [{ fields: ["name_with_initials_en"] }] },
      { columns: [{ fields: ["date_of_birth"] }] },
      { columns: [{ fields: ["gender", "nationality", "religion"] }] },
      { columns: [{ fields: ["birth_certificate_number"] }] },
      { columns: [{ fields: ["medium_of_instruction"] }] },
    ],
  }
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

  const config = makeConfig(excludeChildId)

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
