import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  type VisibilityState,
} from "@tanstack/react-table"
import * as React from "react"
import { Plus, Pencil, Trash2, LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import {
  listEnrollmentsOptions,
  listEnrollmentsQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { deleteEnrollment } from "@/lib/api-client/sdk.gen"
import type { G1Enrollment } from "@/lib/api-client/types.gen"
import { DataTable } from "@/components/ui/data-table/data-table"
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar"
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { G1EnrollmentDialog } from "@/components/enrollment/g1/g1-enrollment-dialog"
import type { G1SearchParams } from "@/routes/_authenticated/student-management/enrollment/g1"

const LABELS: Record<string, string> = {
  Male: "Male",
  Female: "Female",
  SriLankan: "Sri Lankan",
  DualCitizen: "Dual Citizen",
  Other: "Other",
  CloseResident: "Close Resident",
  PastPupilChild: "Past Pupil Child",
  Sibling: "Sibling",
  MOEOrUGCStaffChild: "MOE or UGC Staff Child",
  GovernmentTransferOfficerChild: "Government Transfer Officer Child",
  OverseasArrival: "Overseas Arrival",
  ArmedForcesReserved: "Armed Forces Reserved",
  Sinhala: "Sinhala",
  Tamil: "Tamil",
  Draft: "Draft",
  Pending: "Pending",
  ProvisionallyApproved: "Provisionally Approved",
  Approved: "Approved",
  Rejected: "Rejected",
  Withdrawn: "Withdrawn",
  Removed: "Removed",
}

const ENUM_OPTIONS = {
  gender: [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
  ],
  nationality: [
    { label: "Sri Lankan", value: "SriLankan" },
    { label: "Dual Citizen", value: "DualCitizen" },
    { label: "Other", value: "Other" },
  ],
  category: [
    { label: "Close Resident", value: "CloseResident" },
    { label: "Past Pupil Child", value: "PastPupilChild" },
    { label: "Sibling", value: "Sibling" },
    { label: "MOE or UGC Staff Child", value: "MOEOrUGCStaffChild" },
    { label: "Government Transfer Officer Child", value: "GovernmentTransferOfficerChild" },
    { label: "Overseas Arrival", value: "OverseasArrival" },
    { label: "Armed Forces Reserved", value: "ArmedForcesReserved" },
  ],
  medium_of_instruction: [
    { label: "Sinhala", value: "Sinhala" },
    { label: "Tamil", value: "Tamil" },
  ],
  enrollment_status: [
    { label: "Draft", value: "Draft" },
    { label: "Pending", value: "Pending" },
    { label: "Provisionally Approved", value: "ProvisionallyApproved" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Withdrawn", value: "Withdrawn" },
    { label: "Removed", value: "Removed" },
  ],
}

const FILTER_KEYS = ["full_name", "name_with_initials", "gender", "nationality", "category", "medium_of_instruction", "enrollment_status"] as const
const ENUM_KEYS = new Set(["gender", "nationality", "category", "medium_of_instruction", "enrollment_status"])

interface G1DatagridProps {
  search: G1SearchParams
  navigate: (opts: { search: G1SearchParams }) => void
}

const G1Datagrid = ({ search, navigate }: G1DatagridProps) => {
  const queryClient = useQueryClient()

  const queryOptions = React.useMemo(() => ({
    client: apiClient,
    query: {
      page: search.page,
      page_size: search.page_size,
      sort_by: search.sort_by,
      sort_order: search.sort_order,
      full_name: search.full_name,
      name_with_initials: search.name_with_initials,
      gender: search.gender,
      nationality: search.nationality,
      category: search.category,
      medium_of_instruction: search.medium_of_instruction,
      enrollment_status: search.enrollment_status,
    },
  }), [search])

  const { data } = useSuspenseQuery(listEnrollmentsOptions(queryOptions))
  const enrollments = data.items
  const total = data.total

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<G1Enrollment | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const onSuccess = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: listEnrollmentsQueryKey() })
  }, [queryClient])

  const handleDelete = React.useCallback(
    async (rowId: string) => {
      setDeleting(true)
      try {
        await deleteEnrollment({ path: { id: rowId }, client: apiClient })
        setDeleteTarget(null)
        queryClient.invalidateQueries({ queryKey: listEnrollmentsQueryKey() })
        toast.success("Enrollment deleted")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Delete failed"
        toast.error(message)
      } finally {
        setDeleting(false)
      }
    },
    [queryClient],
  )

  const handleAdd = React.useCallback(() => {
    setEditTarget(null)
    setDialogOpen(true)
  }, [])

  const handleEdit = React.useCallback((enrollment: G1Enrollment) => {
    setEditTarget(enrollment)
    setDialogOpen(true)
  }, [])

  const sorting: SortingState = React.useMemo(() => {
    if (!search.sort_by) return []
    return [{ id: search.sort_by, desc: search.sort_order === "desc" }]
  }, [search.sort_by, search.sort_order])

  const columnFilters: ColumnFiltersState = React.useMemo(() => {
    const filters: ColumnFiltersState = []
    for (const key of FILTER_KEYS) {
      const value = search[key]
      if (value) {
        filters.push({
          id: key,
          value: ENUM_KEYS.has(key) ? [value] : value,
        })
      }
    }
    return filters
  }, [search])

  const pagination: PaginationState = React.useMemo(
    () => ({ pageIndex: Math.max(0, search.page - 1), pageSize: search.page_size }),
    [search.page, search.page_size],
  )

  const handleColumnFiltersChange = React.useCallback(
    (updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
      const newFilters = typeof updater === "function" ? updater(columnFilters) : updater
      const next = { ...search, page: 1, page_size: search.page_size }
      for (const key of FILTER_KEYS) {
        const filter = newFilters.find(f => f.id === key)
        if (filter) {
          const val = Array.isArray(filter.value) ? filter.value[0] : filter.value
          ;(next as Record<string, unknown>)[key] = val ? String(val) : undefined
        } else {
          ;(next as Record<string, unknown>)[key] = undefined
        }
      }
      navigate({ search: next as unknown as G1SearchParams })
    },
    [columnFilters, navigate, search],
  )

  const handleSortingChange = React.useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      const newSorting = typeof updater === "function" ? updater(sorting) : updater
      const next = { ...search }
      if (newSorting.length === 0) {
        next.sort_by = undefined
        next.sort_order = undefined
      } else {
        const { id, desc } = newSorting[0]
        next.sort_by = id
        next.sort_order = desc ? "desc" : "asc"
      }
      navigate({ search: next })
    },
    [sorting, navigate, search],
  )

  const handlePaginationChange = React.useCallback(
    (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => {
      const newPagination = typeof updater === "function" ? updater(pagination) : updater
      const next = { ...search, page: newPagination.pageIndex + 1, page_size: newPagination.pageSize }
      navigate({ search: next })
    },
    [pagination, navigate, search],
  )

  const columns = React.useMemo<ColumnDef<G1Enrollment>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: ({ column }) => <DataTableColumnHeader column={column} label="Full Name" />,
        enableColumnFilter: true,
        meta: { label: "Full Name", variant: "text" },
      },
      {
        accessorKey: "name_with_initials",
        header: ({ column }) => <DataTableColumnHeader column={column} label="Name with Initials" />,
        enableColumnFilter: true,
        meta: { label: "Name with Initials", variant: "text" },
      },
      {
        accessorKey: "date_of_birth",
        header: ({ column }) => <DataTableColumnHeader column={column} label="Date of Birth" />,
        enableColumnFilter: false,
        meta: { label: "Date of Birth", variant: "text" },
      },
      {
        accessorKey: "gender",
        header: ({ column }) => <DataTableColumnHeader column={column} label="Gender" />,
        enableColumnFilter: true,
        meta: { label: "Gender", variant: "select", options: ENUM_OPTIONS.gender },
        cell: ({ getValue }) => LABELS[getValue() as string] ?? (getValue() as string),
        filterFn: "equals",
      },
      {
        accessorKey: "nationality",
        header: ({ column }) => <DataTableColumnHeader column={column} label="Nationality" />,
        enableColumnFilter: true,
        meta: { label: "Nationality", variant: "select", options: ENUM_OPTIONS.nationality },
        cell: ({ getValue }) => LABELS[getValue() as string] ?? (getValue() as string),
        filterFn: "equals",
      },
      {
        accessorKey: "category",
        header: ({ column }) => <DataTableColumnHeader column={column} label="Category" />,
        enableColumnFilter: true,
        meta: { label: "Category", variant: "select", options: ENUM_OPTIONS.category },
        cell: ({ getValue }) => LABELS[getValue() as string] ?? (getValue() as string),
        filterFn: "equals",
      },
      {
        accessorKey: "medium_of_instruction",
        header: ({ column }) => <DataTableColumnHeader column={column} label="Medium" />,
        enableColumnFilter: true,
        meta: { label: "Medium", variant: "select", options: ENUM_OPTIONS.medium_of_instruction },
        cell: ({ getValue }) => LABELS[getValue() as string] ?? (getValue() as string),
        filterFn: "equals",
      },
      {
        accessorKey: "enrollment_status",
        header: ({ column }) => <DataTableColumnHeader column={column} label="Status" />,
        enableColumnFilter: true,
        meta: { label: "Status", variant: "select", options: ENUM_OPTIONS.enrollment_status },
        cell: ({ getValue }) => LABELS[getValue() as string] ?? (getValue() as string),
        filterFn: "equals",
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => handleEdit(row.original)}
            >
              <Pencil className="size-4" />
            </Button>
            <AlertDialog
              open={deleteTarget === row.original.id}
              onOpenChange={(open) => {
                if (!open) setDeleteTarget(null)
              }}
            >
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-destructive"
                  />
                }
                onClick={() => setDeleteTarget(row.original.id!)}
              >
                <Trash2 className="size-4" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Enrollment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{" "}
                    {row.original.full_name || "this enrollment"}? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleting}
                    onClick={() => handleDelete(row.original.id!)}
                  >
                    {deleting ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ),
      },
    ],
    [handleEdit, deleteTarget, deleting, handleDelete],
  )

  const table = useReactTable({
    data: enrollments,
    columns,
    rowCount: total,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualFiltering: true,
    manualSorting: true,
    manualPagination: true,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onPaginationChange: handlePaginationChange,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">G1 Enrollments</h2>
        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          Add Enrollment
        </Button>
      </div>
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
      <G1EnrollmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        enrollment={editTarget}
        onSuccess={onSuccess}
      />
    </div>
  )
}

export { G1Datagrid }
export default G1Datagrid
