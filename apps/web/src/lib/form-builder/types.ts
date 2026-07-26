import type * as v from "valibot"
import type { UseMutationOptions } from "@tanstack/react-query"

export type FieldKind =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "date"
  | "slider"
  | "display"
  | "custom"

export type SelectOption = {
  value: string
  label: string
}

export type FieldEntry<
  TData extends Record<string, unknown> = Record<string, unknown>,
> = {
  name: keyof TData & string
  kind: FieldKind
  label: string
  description?: string
  placeholder?: string
  options?: SelectOption[] | (() => SelectOption[] | Promise<SelectOption[]>)
  systemManaged?: boolean
  hidden?: boolean
  disabled?: boolean
  required?: boolean
  layout?: { row: number; column: number; columnSpan?: number }
  section?: string
  inputProps?: Record<string, unknown>
  onChangeOverride?: (
    value: unknown,
    handleChange: (val: unknown) => void,
  ) => void
  /** Render arbitrary content for kind="custom" */
  customRenderer?: (args: {
    value: unknown
    onChange: (val: unknown) => void
    name: string
  }) => React.ReactNode
  /** Override the label rendering for this field */
  renderLabel?: (label: string) => React.ReactNode
}

export type RowConfig = {
  columns: Array<{
    fields: string[]
    span?: number
  }>
}

export type SectionConfig = {
  id: string
  title: string
  description?: string
  collapsible?: boolean
  defaultOpen?: boolean
  /** Render custom content after section fields. Receives form values. */
  renderCustom?: (values: Record<string, unknown>) => React.ReactNode
}

export type FormLifecycleHooks<TData> = {
  beforeSubmit?: (values: TData) => TData | Promise<TData>
  onSuccess?: (result: unknown) => void | Promise<void>
  onError?: (error: Error) => void | Promise<void>
}

export type FormConfig<
  TData extends Record<string, unknown> = Record<string, unknown>,
> = {
  fields: FieldEntry<TData>[]
  layout: RowConfig[]
  sections?: SectionConfig[]
  hooks?: FormLifecycleHooks<TData>
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  /** Render custom content above the auto-generated fields. Receives current form values. */
  renderAboveFields?: (values: Record<string, unknown>) => React.ReactNode
  /** Render custom content below the auto-generated fields. Receives current form values. */
  renderBelowFields?: (values: Record<string, unknown>) => React.ReactNode
}

export type FormBuilderProps<
  TData extends Record<string, unknown>,
  TMutateResult = unknown,
> = {
  children?: React.ReactNode
  config: FormConfig<TData>
  defaultValues: TData
  valibotSchema?: v.GenericSchema<TData>
  mutationOptions?: UseMutationOptions<
    TMutateResult,
    Error,
    { body: TData },
    unknown
  >
  queryKeysToInvalidate?: Array<unknown>
  onSubmit?: (values: TData) => Promise<TMutateResult | void>
  formId?: string
  renderSubmitOutside?: boolean
  /** Hide the default submit/cancel buttons (you render them yourself) */
  hideDefaultButtons?: boolean
  submitting?: boolean
}
