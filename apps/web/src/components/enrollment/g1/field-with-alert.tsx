"use client"

import { useStore } from "@tanstack/react-form"
import { Input } from "@/components/ui/input"
import { FieldContent } from "@/components/ui/field"
import { useBuildForm } from "@/lib/form-builder"
import {
  useChildUniqueness,
  useRegisterUniquenessField,
} from "@/hooks/use-child-uniqueness"
import { UniquenessAlert } from "@/components/enrollment/g1/duplicate-child-alert"
import type { ChildUniquenessCheckType } from "@/hooks/use-child-uniqueness"

interface FieldWithAlertProps {
  fieldName: string
  placeholder?: string
  checkType: ChildUniquenessCheckType
  excludeChildId?: string | null
  inputProps?: Record<string, unknown>
}

export function FieldWithAlert({
  fieldName,
  placeholder,
  checkType,
  excludeChildId,
  inputProps,
}: FieldWithAlertProps) {
  const form = useBuildForm()
  const formValues = useStore(
    form.store,
    (state: any) => state.values
  ) as Record<string, unknown>
  const value = (formValues[fieldName] as string) ?? ""

  const uniqueness = useChildUniqueness(value, checkType, excludeChildId)

  useRegisterUniquenessField(fieldName, uniqueness.blocksSubmit)

  return (
    <FieldContent>
      <Input
        id={fieldName}
        name={fieldName}
        value={value}
        onChange={(e) => form.setFieldValue(fieldName as any, e.target.value)}
        placeholder={placeholder}
        aria-invalid={uniqueness.blocksSubmit || undefined}
        {...inputProps}
      />
      <UniquenessAlert
        childDuplicates={uniqueness.childDuplicates}
        guardianDuplicates={uniqueness.guardianDuplicates}
        checkType={checkType}
        isChecking={uniqueness.isChecking}
      />
    </FieldContent>
  )
}
