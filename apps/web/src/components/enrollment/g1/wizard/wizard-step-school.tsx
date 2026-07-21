"use client"

import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

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
  const form = useForm({
    defaultValues,
    onSubmit: async (values) => {
      onSave(values.value)
      onNext()
    },
  })

  const schoolName = form.state.values.school_name_si
  const schoolType = form.state.values.school_type
  const schoolCategory = form.state.values.category
  const schoolQuota = form.state.values.quota

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Step 3: School Selection</CardTitle>
          <CardDescription>Enter the school for admission.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <form.Field
              name="school_name_si"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>School Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                        form.setFieldValue("school_id", e.target.value)
                      }}
                      aria-invalid={isInvalid}
                      placeholder="Enter school name"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
          </FieldGroup>
          {schoolName && (
            <div className="mt-4 space-y-2 rounded-lg border p-4">
              <h4 className="font-semibold">{schoolName}</h4>
              <div className="flex gap-2">
                <Badge variant="outline">{schoolType || "N/A"}</Badge>
                <Badge variant="outline">{schoolCategory || "N/A"}</Badge>
                <Badge>Quota: {schoolQuota || "\u2014"}</Badge>
              </div>
            </div>
          )}
          <div className="flex justify-between pt-4">
            <Button variant="outline" type="button" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" disabled={!schoolName}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
