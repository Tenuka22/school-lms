"use client"

import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  IconSearch,
  IconDots,
  IconLoader2,
  IconPencil,
  IconSchool,
} from "@tabler/icons-react"
import { apiClient } from "@/lib/api-client"
import { listChildrenQueryKey } from "@/lib/api-client/@tanstack/react-query.gen"
import { listChildren } from "@/lib/api-client/sdk.gen"

import { formatDate } from "@/lib/format"
import { getEnumLabel, getEnumStyle } from "@/lib/enum-badge"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table/data-table"
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar"
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import type { Child } from "@/lib/api-client/types.gen"
import type {
  SortingState,
  ColumnFiltersState,
  PaginationState,
  VisibilityState,
  ColumnDef,
} from "@tanstack/react-table"
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function EnumBadge({
  column,
  value,
}: {
  column: string
  value: string | null | undefined
}) {
  if (!value) return <span className="text-sm text-muted-foreground">—</span>
  const label = getEnumLabel(column, value)
  const style = getEnumStyle(column, value)
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${style ?? "border-border bg-muted text-muted-foreground"}`}
    >
      {label}
    </span>
  )
}

export function ChildrenDataGrid({
  hasStudent,
  onEdit,
}: {
  hasStudent?: boolean
  onEdit?: (child: Child) => void
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const { data: children = [], isLoading } = useQuery({
    queryKey: [
      ...listChildrenQueryKey({ client: apiClient }),
      debouncedSearch,
      hasStudent,
    ],
    queryFn: async () => {
      const { data } = await listChildren({
        client: apiClient,
        query: {
          search: debouncedSearch || undefined,
          has_student: hasStudent != null ? String(hasStudent) : undefined,
        },
      })
      return data ?? []
    },
  })

  const columns = useMemo<ColumnDef<Child>[]>(
    () => [
      {
        id: "avatar",
        enableHiding: false,
        header: () => <span className="sr-only">Photo</span>,
        cell: ({ row }) => {
          const c = row.original
          return (
            <Avatar size="sm">
              {c.photo_url ? (
                <AvatarImage src={c.photo_url} alt={c.full_name} />
              ) : null}
              <AvatarFallback>{getInitials(c.full_name)}</AvatarFallback>
            </Avatar>
          )
        },
        meta: { label: "Photo", variant: "text" },
      },
      {
        accessorKey: "full_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Full Name" />
        ),
        cell: ({ row }) => {
          const child = row.original
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium">{child.full_name}</span>
              {child.student_id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate({
                      to: "/student-management/students",
                    })
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20"
                  title="View student record"
                >
                  <IconSchool className="size-3" />
                  Student
                </button>
              )}
            </div>
          )
        },
        meta: { label: "Full Name", variant: "text" },
      },
      {
        accessorKey: "name_with_initials",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Initials" />
        ),
        meta: { label: "Name with Initials", variant: "text" },
      },
      {
        accessorKey: "date_of_birth",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Date of Birth" />
        ),
        cell: ({ row }) => {
          const val = row.getValue("date_of_birth")
          return val ? formatDate(new Date(val + "T00:00:00")) : "—"
        },
        meta: { label: "Date of Birth", variant: "date" },
      },
      {
        accessorKey: "gender",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Gender" />
        ),
        cell: ({ row }) => (
          <EnumBadge column="gender" value={row.getValue("gender")} />
        ),
        meta: {
          label: "Gender",
          variant: "select",
          options: [
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
          ],
        },
      },
      {
        accessorKey: "nationality",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Nationality" />
        ),
        cell: ({ row }) => (
          <EnumBadge column="nationality" value={row.getValue("nationality")} />
        ),
        meta: {
          label: "Nationality",
          variant: "select",
          options: [
            { value: "SriLankan", label: "Sri Lankan" },
            { value: "DualCitizen", label: "Dual Citizen" },
            { value: "Other", label: "Other" },
          ],
        },
      },
      {
        accessorKey: "religion",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Religion" />
        ),
        cell: ({ row }) => (
          <EnumBadge column="religion" value={row.getValue("religion")} />
        ),
        meta: {
          label: "Religion",
          variant: "select",
          options: [
            { value: "Buddhism", label: "Buddhism" },
            { value: "Hinduism", label: "Hinduism" },
            { value: "Islam", label: "Islam" },
            { value: "Christianity", label: "Christianity" },
            { value: "Catholicism", label: "Catholicism" },
          ],
        },
      },
      {
        accessorKey: "medium_of_instruction",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Medium" />
        ),
        cell: ({ row }) => (
          <EnumBadge
            column="medium_of_instruction"
            value={row.getValue("medium_of_instruction")}
          />
        ),
        meta: {
          label: "Medium of Instruction",
          variant: "select",
          options: [
            { value: "Sinhala", label: "Sinhala" },
            { value: "Tamil", label: "Tamil" },
          ],
        },
      },
      {
        accessorKey: "birth_certificate_number",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="BC Number" />
        ),
        meta: { label: "Birth Certificate Number", variant: "text" },
      },
      {
        accessorKey: "nic",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="NIC" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue("nic") || "—"}</span>
        ),
        meta: { label: "NIC", variant: "text" },
      },
      {
        id: "actions",
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const child = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="size-8">
                      <IconDots className="size-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(child)}>
                      <IconPencil className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {child.student_id && (
                    <DropdownMenuItem
                      onClick={() =>
                        navigate({ to: "/student-management/students" })
                      }
                    >
                      <IconSchool className="mr-2 size-4" />
                      View Student Record
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [onEdit, navigate]
  )

  const table = useReactTable({
    data: children,
    columns,
    pageCount: -1,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    manualPagination: false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <IconSearch className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search children..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable table={table}>
          <DataTableToolbar table={table} />
        </DataTable>
      )}
    </div>
  )
}
