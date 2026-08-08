"use client"

import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import {
  IconSearch,
  IconDots,
  IconLoader2,
} from "@tabler/icons-react"
import { apiClient } from "@/lib/api-client"
import { listStudents } from "@/lib/api-client/sdk.gen"
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

type StudentRow = {
  id: string
  child_id: string
  created_at: string
  full_name: string
  name_with_initials: string
  date_of_birth: string
  gender: string
  birth_certificate_number: string | null
  nic: string | null
  nationality: string
  medium_of_instruction: string
  admission_number: string | null
  current_grade: number | null
  phone: string | null
  email: string | null
  status: string
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

export function StudentsDataGrid({}: { refreshKey?: number }) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["listStudents", debouncedSearch],
    queryFn: async () => {
      const { data } = await listStudents({
        client: apiClient,
        query: { search: debouncedSearch || undefined },
      })
      return (data ?? []) as StudentRow[]
    },
  })

  const columns = useMemo<ColumnDef<StudentRow>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Full Name" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("full_name")}</div>
        ),
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
          const val = row.getValue("date_of_birth") as string
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
          <EnumBadge column="gender" value={row.getValue("gender") as string} />
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
        accessorKey: "admission_number",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Admission No" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.getValue("admission_number") || "—"}
          </span>
        ),
        meta: { label: "Admission Number", variant: "text" },
      },
      {
        accessorKey: "current_grade",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Grade" />
        ),
        cell: ({ row }) => {
          const val = row.getValue("current_grade") as number | null
          return val !== null ? (
            <span className="text-sm">Grade {val}</span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )
        },
        meta: { label: "Current Grade", variant: "text" },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        cell: ({ row }) => (
          <EnumBadge
            column="student_status"
            value={row.getValue("status") as string}
          />
        ),
        meta: {
          label: "Status",
          variant: "select",
          options: [
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
            { value: "Transferred", label: "Transferred" },
            { value: "Graduated", label: "Graduated" },
          ],
        },
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Phone" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {row.getValue("phone") || "—"}
          </span>
        ),
        meta: { label: "Phone", variant: "text" },
      },
      {
        id: "actions",
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: () => {
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
                  <DropdownMenuItem disabled>
                    Edit (coming soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: students,
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
          <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
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
