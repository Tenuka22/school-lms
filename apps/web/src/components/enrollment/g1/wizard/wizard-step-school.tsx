"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { FormBuilder } from "@/lib/form-builder"
import type { FormConfig } from "@/lib/form-builder"

export type SchoolFormData = {
  school_id: string
  school_name_si: string
  school_type: string
  category: string
  quota: number
}

interface Props {
  defaultValues: SchoolFormData
  onSave: (data: SchoolFormData) => void
  onBack: () => void
  onNext: () => void
}

export function WizardStepSchool({
  defaultValues,
  onSave,
  onBack,
  onNext,
}: Props) {
  const config: FormConfig<SchoolFormData> = {
    fields: [
      {
        name: "school_name_si",
        kind: "text",
        label: "School Name",
        placeholder: "Enter school name",
      },
      { name: "school_id", kind: "display", label: "", hidden: true },
      { name: "school_type", kind: "display", label: "", hidden: true },
      { name: "category", kind: "display", label: "", hidden: true },
      { name: "quota", kind: "display", label: "", hidden: true },
    ],
    layout: [{ columns: [{ fields: ["school_name_si"] }] }],
    renderBelowFields: (formValues) =>
      formValues.school_name_si ? (
        <div className="mt-4 space-y-2 rounded-lg border p-4">
          <h4 className="font-semibold">
            {formValues.school_name_si as string}
          </h4>
          <div className="flex gap-2">
            <Badge variant="outline">
              {(formValues.school_type as string) || "N/A"}
            </Badge>
            <Badge variant="outline">
              {(formValues.category as string) || "N/A"}
            </Badge>
            <Badge>
              Quota:{" "}
              {formValues.quota != null ? String(formValues.quota) : "\u2014"}
            </Badge>
          </div>
        </div>
      ) : null,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: School Selection</CardTitle>
        <CardDescription>Enter the school for admission.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormBuilder<SchoolFormData>
          config={config}
          defaultValues={defaultValues}
          onSubmit={async (values) => {
            onSave({ ...values, school_id: values.school_name_si })
            onNext()
          }}
          formId="wizard-step-school-form"
          hideDefaultButtons
        />
        <div className="flex justify-between pt-4">
          <Button variant="outline" type="button" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" form="wizard-step-school-form">
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
