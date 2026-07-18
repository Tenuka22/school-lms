import type React from "react"

export interface Option {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  count?: number
}

export interface DataTableColumnMeta {
  variant?: "text" | "number" | "range" | "date" | "dateRange" | "select" | "multiSelect"
  label?: string
  placeholder?: string
  options?: Option[]
  range?: [number, number]
  unit?: string
}
