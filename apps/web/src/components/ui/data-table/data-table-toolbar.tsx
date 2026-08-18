"use client"

import type { Column, Table } from "@tanstack/react-table"
import { IconX } from "@tabler/icons-react"
import * as React from "react"

import { DataTableDateFilter } from "@/components/ui/data-table/data-table-date-filter"
import { DataTableFacetedFilter } from "@/components/ui/data-table/data-table-faceted-filter"
import { DataTableSliderFilter } from "@/components/ui/data-table/data-table-slider-filter"
import { DataTableViewOptions } from "@/components/ui/data-table/data-table-view-options"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table]
  )

  const onReset = React.useCallback(() => {
    table.resetColumnFilters()
  }, [table])

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full items-start justify-between gap-2 p-1",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {columns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        {isFiltered && (
          <Button
            aria-label="Reset filters"
            variant="outline"
            size="sm"
            className="border-dashed"
            onClick={onReset}
          >
            <IconX />
            Reset
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} align="end" />
      </div>
    </div>
  )
}
interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>
}

function DataTableToolbarFilter<TData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta as
    | Record<string, unknown>
    | undefined

  if (!columnMeta?.variant) return null

  const label = columnMeta.label as string | undefined
  const placeholder = columnMeta.placeholder as string | undefined
  const unit = columnMeta.unit as string | undefined
  const options = columnMeta.options as
    | { value: string; label: string }[]
    | undefined

  switch (columnMeta.variant) {
    case "text":
      return (
        <Input
          placeholder={placeholder ?? label}
          value={column.getFilterValue() as string}
          onChange={(event) => column.setFilterValue(event.target.value)}
          className="h-8 w-40 lg:w-56"
        />
      )

    case "number":
      return (
        <div className="relative">
          <Input
            type="number"
            inputMode="numeric"
            placeholder={placeholder ?? label}
            value={column.getFilterValue() as string}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className={cn("h-8 w-[120px]", unit && "pr-8")}
          />
          {unit && (
            <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-sm text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
      )

    case "range":
      return (
        <DataTableSliderFilter
          column={column}
          title={label ?? column.id}
        />
      )

    case "date":
    case "dateRange":
      return (
        <DataTableDateFilter
          column={column}
          title={label ?? column.id}
          multiple={columnMeta.variant === "dateRange"}
        />
      )

    case "select":
    case "multiSelect":
      return (
        <DataTableFacetedFilter
          column={column}
          title={label ?? column.id}
          options={options ?? []}
          multiple={columnMeta.variant === "multiSelect"}
        />
      )

    default:
      return null
  }
}
