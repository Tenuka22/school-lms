"use client"

import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import {
  IconSearch,
  IconDots,
  IconLoader2,
  IconChevronRight,
  IconSchool,
  IconUser,
} from "@tabler/icons-react"
import { apiClient } from "@/lib/api-client"
import { listGuardians } from "@/lib/api-client/sdk.gen"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type {
  GuardianWithChildren,
  ChildInfo,
} from "@/lib/api-client/types.gen"
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

function ChildrenTree({ children }: { children: ChildInfo[] }) {
  const [expanded, setExpanded] = useState(false)

  if (children.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">No children linked</span>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <IconChevronRight
          className={`size-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        {children.length} {children.length === 1 ? "child" : "children"}
      </button>
      {expanded && (
        <div className="ml-5 flex flex-col gap-1 border-l-2 border-border pl-2">
          {children.map((child) => (
            <div key={child.id} className="flex items-center gap-2 text-sm">
              <Avatar className="size-5">
                <AvatarFallback className="text-[10px]">
                  {getInitials(child.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{child.full_name}</span>
              {child.current_grade != null && (
                <span className="text-muted-foreground">
                  Grade {child.current_grade}
                </span>
              )}
              <EnumBadge column="student_status" value={child.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function GuardiansDataGrid({}: { refreshKey?: number }) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [isPastPupilFilter, setIsPastPupilFilter] = useState<string>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const { data: guardians = [], isLoading } = useQuery({
    queryKey: ["listGuardians", debouncedSearch, isPastPupilFilter],
    queryFn: async () => {
      const { data } = await listGuardians({
        client: apiClient,
        query: {
          search: debouncedSearch || undefined,
          is_past_pupil: isPastPupilFilter || undefined,
        },
      })
      return (data ?? []) as GuardianWithChildren[]
    },
  })

  const columns = useMemo<ColumnDef<GuardianWithChildren>[]>(
    () => [
      {
        id: "avatar",
        enableHiding: false,
        header: () => <span className="sr-only">Photo</span>,
        cell: ({ row }) => {
          const g = row.original
          return (
            <Avatar size="sm">
              <AvatarFallback>{getInitials(g.full_name)}</AvatarFallback>
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
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("full_name")}</div>
        ),
        meta: { label: "Full Name", variant: "text" },
      },
      {
        accessorKey: "relationship_type",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Relationship" />
        ),
        cell: ({ row }) => (
          <EnumBadge
            column="guardian_relationship"
            value={row.getValue("relationship_type") as string}
          />
        ),
        meta: {
          label: "Relationship",
          variant: "select",
          options: [
            { value: "Father", label: "Father" },
            { value: "Mother", label: "Mother" },
            { value: "Guardian", label: "Guardian" },
          ],
        },
      },
      {
        accessorKey: "nic_number",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="NIC" />
        ),
        meta: { label: "NIC Number", variant: "text" },
      },
      {
        accessorKey: "contact_phone",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Phone" />
        ),
        meta: { label: "Phone", variant: "text" },
      },
      {
        accessorKey: "occupation",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Occupation" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue("occupation") || "—"}</span>
        ),
        meta: { label: "Occupation", variant: "text" },
      },
      {
        accessorKey: "is_school_staff",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Staff" />
        ),
        cell: ({ row }) => {
          const val = row.getValue("is_school_staff") as boolean
          return val ? (
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              School Staff
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
        meta: { label: "Is School Staff", variant: "text" },
      },
      {
        accessorKey: "is_past_pupil",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Alumni" />
        ),
        cell: ({ row }) => {
          const g = row.original
          return g.is_past_pupil ? (
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <IconSchool className="mr-1 size-3" />
              Past Pupil
              {g.past_pupil_verified && " ✓"}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
        meta: {
          label: "Alumni",
          variant: "select",
          options: [
            { value: "true", label: "Past Pupil" },
            { value: "false", label: "Not Alumni" },
          ],
        },
      },
      {
        id: "children",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Children" />
        ),
        cell: ({ row }) => <ChildrenTree children={row.original.children} />,
        meta: { label: "Children", variant: "text" },
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
    data: guardians,
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
            placeholder="Search guardians..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant={isPastPupilFilter === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPastPupilFilter("")}
          >
            All
          </Button>
          <Button
            variant={isPastPupilFilter === "true" ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPastPupilFilter("true")}
          >
            <IconSchool className="mr-1 size-3.5" />
            Alumni
          </Button>
          <Button
            variant={isPastPupilFilter === "false" ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPastPupilFilter("false")}
          >
            <IconUser className="mr-1 size-3.5" />
            Non-Alumni
          </Button>
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
