"use client"

import type { Column } from "@tanstack/react-table"
import { IconChevronDown, IconArrowsSort, IconChevronUp, IconEyeOff, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.ComponentProps<typeof DropdownMenuTrigger> {
  column: Column<TData, TValue>
  label: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  label,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{label}</div>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "-ml-1.5 flex h-8 items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring data-[state=open]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {label}
        {column.getCanSort() &&
          (column.getIsSorted() === "desc" ? (
            <IconChevronDown />
          ) : column.getIsSorted() === "asc" ? (
            <IconChevronUp />
          ) : (
            <IconArrowsSort />
          ))}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-28">
        {column.getCanSort() && (
          <>
            <DropdownMenuItem
              className="gap-2 pl-2 [&_svg]:text-muted-foreground"
              onClick={() => column.toggleSorting(false)}
            >
              <IconChevronUp className={cn("size-4", column.getIsSorted() === "asc" ? "opacity-100" : "opacity-40")} />
              Asc
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 pl-2 [&_svg]:text-muted-foreground"
              onClick={() => column.toggleSorting(true)}
            >
              <IconChevronDown className={cn("size-4", column.getIsSorted() === "desc" ? "opacity-100" : "opacity-40")} />
              Desc
            </DropdownMenuItem>
            {column.getIsSorted() && (
              <DropdownMenuItem
                className="gap-2 pl-2 [&_svg]:text-muted-foreground"
                onClick={() => column.clearSorting()}
              >
                <IconX className="size-4" />
                Reset
              </DropdownMenuItem>
            )}
          </>
        )}
        {column.getCanHide() && (
          <DropdownMenuItem
            className="gap-2 pl-2 [&_svg]:text-muted-foreground"
            onClick={() => column.toggleVisibility(false)}
          >
            <IconEyeOff className="size-4" />
            Hide
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
