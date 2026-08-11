import type React from "react"
import type { ColumnMeta } from "@tanstack/react-table"

export interface Option {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  count?: number
}

export interface DataTableColumnMeta<TData, TValue> extends ColumnMeta<TData, TValue> {
  variant?:
    | "text"
    | "number"
    | "range"
    | "date"
    | "dateRange"
    | "select"
    | "multiSelect"
  label?: string
  placeholder?: string
  options?: Option[]
  range?: [number, number]
  unit?: string
}
