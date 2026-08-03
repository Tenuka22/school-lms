"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FieldLabel } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { IconLoader2, IconCheck } from "@tabler/icons-react"
import { FormBuilder } from "@/lib/form-builder"
import { optionsFromSchema } from "@/lib/form-builder"
import type { FormConfig } from "@/lib/form-builder"
import { useBuildForm } from "@/lib/form-builder/form-context"
import {
  GenderSchema,
  NationalitySchema,
  ReligionSchema,
  MediumOfInstructionSchema,
} from "@/lib/api-client/schemas.gen"
import type {
  Gender,
  Nationality,
  MediumOfInstruction,
} from "@/lib/api-client/types.gen"

export type ChildFormData = {
  full_name: string
  name_with_initials: string
  date_of_birth: string
  gender: Gender
  nationality: Nationality
  religion: string
  birth_certificate_number: string
  medium_of_instruction: MediumOfInstruction
  category: string
  overseas_arrival_date: string
  disability_status: boolean
  disability_type: string
}

interface Props {
  defaultValues: ChildFormData
  onSave: (data: ChildFormData) => Promise<void>
  onNext: () => void
}

function OverseasArrivalField() {
  const form = useBuildForm()
  return (
    <form.Field
      name="overseas_arrival_date"
      children={(field: any) => (
        <div>
          <FieldLabel htmlFor="overseas_arrival_date">
            Overseas Arrival Date
          </FieldLabel>
          <DatePicker
            value={field.state.value}
            onChange={(d) => field.handleChange(d)}
          />
        </div>
      )}
    />
  )
}

export function WizardStepChild({ defaultValues, onSave, onNext }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  const config: FormConfig<ChildFormData> = {
    fields: [
      {
        name: "full_name",
        kind: "text",
        label: "Full Name",
        placeholder: "Nimal Perera",
      },
      {
        name: "name_with_initials",
        kind: "text",
        label: "Name with Initials",
        placeholder: "N. Perera",
      },
      { name: "date_of_birth", kind: "date", label: "Date of Birth" },
      {
        name: "gender",
        kind: "select",
        label: "Gender",
        options: optionsFromSchema(GenderSchema),
      },
      {
        name: "nationality",
        kind: "select",
        label: "Nationality",
        options: optionsFromSchema(NationalitySchema),
      },
      {
        name: "religion",
        kind: "select",
        label: "Religion",
        options: [
          { value: "", label: "None" },
          ...optionsFromSchema(ReligionSchema),
        ],
      },
      {
        name: "birth_certificate_number",
        kind: "text",
        label: "Birth Certificate Number",
        placeholder: "Optional",
      },
      {
        name: "medium_of_instruction",
        kind: "select",
        label: "Medium of Instruction",
        options: optionsFromSchema(MediumOfInstructionSchema),
      },
      {
        name: "disability_status",
        kind: "custom",
        label: "Disability Status",
        section: "step1",
        customRenderer: ({ value, onChange }) => (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="size-4"
            />
            <span className="text-sm">Has a disability?</span>
          </div>
        ),
      },
      {
        name: "disability_type",
        kind: "text",
        label: "Disability Type",
        placeholder: "e.g. Visual Impairment",
        section: "step1",
      },
    ],
    layout: [
      { columns: [{ fields: ["full_name", "name_with_initials"] }] },
      { columns: [{ fields: ["date_of_birth"] }] },
      { columns: [{ fields: ["gender"], span: 4 }, { fields: ["nationality"], span: 4 }, { fields: ["religion"], span: 4 }] },
      { columns: [{ fields: ["birth_certificate_number"] }] },
      { columns: [{ fields: ["medium_of_instruction"] }] },
    ],
    renderBelowFields: (formValues) =>
      formValues.category === "OverseasArrival" ? (
        <OverseasArrivalField />
      ) : null,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Child Profile</CardTitle>
        <CardDescription>
          Enter the child's personal details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormBuilder<ChildFormData>
          config={config}
          defaultValues={defaultValues}
          onSubmit={async (values) => {
            setStatus("saving")
            await onSave(values)
            setStatus("done")
            navigateTimer.current = setTimeout(() => onNext(), 400)
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
