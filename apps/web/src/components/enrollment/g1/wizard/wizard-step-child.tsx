"use client"

import { useRef, useState, useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { IconLoader2, IconCheck } from "@tabler/icons-react"
import type {
  Gender,
  Nationality,
  MediumOfInstruction,
  G1Category,
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
  category: G1Category | ""
  overseas_arrival_date: string
}

interface Props {
  defaultValues: ChildFormData
  onSave: (data: ChildFormData) => Promise<void>
  onNext: () => void
}

export function WizardStepChild({ defaultValues, onSave, onNext }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const form = useForm({
    defaultValues,
    onSubmit: async (values) => {
      setStatus("saving")
      await onSave(values.value)
      setStatus("done")
      navigateTimer.current = setTimeout(() => onNext(), 400)
    },
  })

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

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
          <CardTitle>Step 1: Child Profile</CardTitle>
          <CardDescription>Enter the child's personal details.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <form.Field
              name="full_name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Nimal Perera"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="name_with_initials"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Name with Initials
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="N. Perera"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="date_of_birth"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Date of Birth</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="date"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="gender"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Gender</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => val && field.handleChange(val)}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="nationality"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Nationality</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => val && field.handleChange(val)}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SriLankan">Sri Lankan</SelectItem>
                        <SelectItem value="DualCitizen">
                          Dual Citizen
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="religion"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Religion</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val ?? "")}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Select (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Buddhism">Buddhism</SelectItem>
                        <SelectItem value="Hinduism">Hinduism</SelectItem>
                        <SelectItem value="Islam">Islam</SelectItem>
                        <SelectItem value="Christianity">
                          Christianity
                        </SelectItem>
                        <SelectItem value="Catholicism">Catholicism</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="birth_certificate_number"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Birth Certificate Number
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Optional"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            <form.Field
              name="medium_of_instruction"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Medium of Instruction
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(val) => val && field.handleChange(val)}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sinhala">Sinhala</SelectItem>
                        <SelectItem value="Tamil">Tamil</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            />
            {defaultValues.category === "OverseasArrival" && (
              <form.Field
                name="overseas_arrival_date"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Overseas Arrival Date
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="date"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            )}
          </FieldGroup>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={status !== "idle"}>
              {status === "saving" && (
                <IconLoader2 className="mr-1.5 size-4 animate-spin" />
              )}
              {status === "done" && (
                <IconCheck className="mr-1.5 size-4 text-green-600" />
              )}
              {status === "idle"
                ? "Next"
                : status === "saving"
                  ? "Saving…"
                  : "Saved"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
