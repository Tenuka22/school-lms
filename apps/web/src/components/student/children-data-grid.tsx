"use client"

import { useQuery } from "@tanstack/react-query"
import { useState, useMemo, useCallback } from "react"
import {
  IconPlus,
  IconPencil,
  IconSearch,
  IconDots,
  IconLoader2,
} from "@tabler/icons-react"
import { apiClient } from "@/lib/api-client"
import { listChildrenQueryKey } from "@/lib/api-client/@tanstack/react-query.gen"
import { listChildren } from "@/lib/api-client/sdk.gen"
import { queryClient } from "@/router"
import { formatDate } from "@/lib/format"
import { getEnumLabel, getEnumStyle } from "@/lib/enum-badge"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table/data-table"
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar"
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header"
import { CreateChildForm } from "@/components/enrollment/g1/create-child-form"
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

export function ChildrenDataGrid() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editChild, setEditChild] = useState<Child | null>(null)

  const { data: children = [], isLoading } = useQuery({
    queryKey: [...listChildrenQueryKey({ client: apiClient }), debouncedSearch],
    queryFn: async () => {
      const { data } = await listChildren({
        client: apiClient,
        query: { search: debouncedSearch || undefined },
      })
      return (data ?? []) as Child[]
    },
  })

  const columns = useMemo<ColumnDef<Child>[]>(
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
        accessorKey: "birth_certificate_number",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="BC Number" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.getValue("birth_certificate_number") || "—"}
          </span>
        ),
        meta: { label: "Birth Certificate Number", variant: "text" },
      },
      {
        accessorKey: "nic",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="NIC" />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.getValue("nic") || "—"}
          </span>
        ),
        meta: { label: "NIC", variant: "text" },
      },
      {
        accessorKey: "nationality",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Nationality" />
        ),
        cell: ({ row }) => (
          <EnumBadge
            column="nationality"
            value={row.getValue("nationality") as string}
          />
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
        accessorKey: "medium_of_instruction",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Medium" />
        ),
        cell: ({ row }) => (
          <EnumBadge
            column="medium_of_instruction"
            value={row.getValue("medium_of_instruction") as string}
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
                  <DropdownMenuItem
                    onClick={() => {
                      setEditChild(child)
                      setDialogOpen(true)
                    }}
                  >
                    <IconPencil className="mr-2 size-4" />
                    Edit
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

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false)
    setEditChild(null)
  }, [])

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Children</h1>
          <p className="text-sm text-muted-foreground">
            Manage all registered children in the system
          </p>
        </div>
        <Button
          onClick={() => {
            setEditChild(null)
            setDialogOpen(true)
          }}
        >
          <IconPlus className="mr-1.5 size-4" />
          Add Child
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editChild ? `Edit ${editChild.full_name}` : "Create New Child"}
            </DialogTitle>
            <DialogDescription>
              {editChild
                ? "Update the child's details below."
                : "Enter the required details to create a new child record."}
            </DialogDescription>
          </DialogHeader>
          <CreateChildForm
            child={editChild}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: listChildrenQueryKey({ client: apiClient }),
              })
              handleDialogClose()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
