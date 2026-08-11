import type * as v from "valibot"
import type { FieldEntry, RowConfig, FormConfig, SelectOption } from "./types"
import { SYSTEM_FIELDS } from "./enum-utils"

type AnySchema = v.BaseSchema<any, any, any> & Record<string, any>

function unwrapNullish(schema: AnySchema): AnySchema {
  if (
    schema.type === "nullish" ||
    schema.type === "nullable" ||
    schema.type === "optional"
  ) {
    return unwrapNullish(schema.wrapped)
  }
  return schema
}

function unwrapPipe(schema: AnySchema): AnySchema {
  if (schema.type === "pipe") {
    const first = schema.pipe?.[0]
    if (first && typeof first === "object" && first.type) {
      return unwrapPipe(first)
    }
  }
  return schema
}

function resolveBaseType(schema: AnySchema): AnySchema {
  return unwrapPipe(unwrapNullish(schema))
}

function inferFieldKind(schema: AnySchema): {
  kind: string
  options?: SelectOption[]
} {
  const base = resolveBaseType(schema)

  if (base.type === "picklist") {
    const values: readonly string[] = base.options ?? []
    return {
      kind: "select",
      options: values.map((v) => ({
        value: v,
        label: v
          .replace(/_/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
      })),
    }
  }

  if (base.type === "boolean") return { kind: "checkbox" }

  if (base.type === "iso_date" || base.type === "iso_timestamp")
    return { kind: "date" }

  if (base.type === "number") return { kind: "number" }

  if (base.type === "string") return { kind: "text" }

  return { kind: "text" }
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export type SchemaToFormOptions = {
  schema: AnySchema
  /** Fields to include (defaults to all non-system fields) */
  include?: string[]
  /** Fields to exclude */
  exclude?: string[]
  /** Override field kinds or options */
  overrides?: Partial<
    Record<
      string,
      {
        kind?: string
        label?: string
        options?: SelectOption[]
        placeholder?: string
        required?: boolean
      }
    >
  >
}

export function schemaToFormFields<TData extends Record<string, unknown>>(
  opts: SchemaToFormOptions
): FieldEntry<TData>[] {
  const { schema, include, exclude, overrides } = opts
  const entries = (schema as AnySchema).entries as Record<string, AnySchema>
  const keys = Object.keys(entries) as string[]

  const excludeSet = new Set<string>([...SYSTEM_FIELDS, ...(exclude ?? [])])

  const includeSet = include ? new Set<string>(include) : null

  return keys
    .filter((key) => {
      if (excludeSet.has(key)) return false
      if (includeSet && !includeSet.has(key)) return false
      return true
    })
    .map((key) => {
      const fieldSchema = entries[key]
      const isRequired =
        fieldSchema.type !== "nullish" &&
        fieldSchema.type !== "nullable" &&
        fieldSchema.type !== "optional"
      const { kind, options } = inferFieldKind(fieldSchema)
      const override = overrides?.[key]

      return {
        name: key as keyof TData & string,
        kind: (override?.kind ?? kind) as any,
        label: override?.label ?? formatLabel(key),
        placeholder: override?.placeholder,
        options: override?.options ?? options,
        required: override?.required ?? isRequired,
      } satisfies FieldEntry<TData>
    })
}

export function schemaToFormLayout<TData extends Record<string, unknown>>(
  fields: FieldEntry<TData>[],
  columnsPerRow: number = 2
): RowConfig[] {
  const rows: RowConfig[] = []
  for (let i = 0; i < fields.length; i += columnsPerRow) {
    const rowFields = fields.slice(i, i + columnsPerRow)
    rows.push({
      columns: rowFields.map((f) => ({ fields: [f.name as string] })),
    })
  }
  return rows
}

export function schemaToFormConfig<TData extends Record<string, unknown>>(
  opts: SchemaToFormOptions & { columnsPerRow?: number }
): FormConfig<TData> {
  const fields = schemaToFormFields(opts)
  const layout = schemaToFormLayout(fields, opts.columnsPerRow)
  return { fields, layout }
}
