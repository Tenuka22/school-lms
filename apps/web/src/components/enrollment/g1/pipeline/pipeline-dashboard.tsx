"use client"

import { useQuery } from "@tanstack/react-query"
import { useNavigate, Link } from "@tanstack/react-router"
import { useState, useRef, useMemo, useCallback } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import {
  IconPlus,
  IconFolderPlus,
  IconPencil,
  IconTrash,
  IconLoader2,
  IconDots,
  IconExternalLink,
  IconSearch,
  IconUserPlus,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import {
  listBatchesOptions,
  listBatchesQueryKey,
  listApplicationsOptions,
  listApplicationsQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import {
  createApplication,
  deleteApplication,
  listChildren,
} from "@/lib/api-client/sdk.gen"
import { queryClient } from "@/router"
import { CreateBatchDialog } from "@/components/enrollment/g1/create-batch-dialog"
import { CreateChildForm } from "@/components/enrollment/g1/create-child-form"
import { SchoolCombobox } from "@/components/enrollment/g1/wizard/guardian-helpers"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/format"
import { getEnumLabel, getEnumStyle } from "@/lib/enum-badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { FormBuilder } from "@/lib/form-builder"
import type { Child } from "@/lib/api-client/types.gen"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type {
  SortingState,
  ColumnFiltersState,
  PaginationState,
  VisibilityState,
  ColumnDef,
} from "@tanstack/react-table"
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table/data-table"
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar"
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header"

import { Route } from "@/routes/_authenticated/student-management/enrollment/g1"
import type { DashboardSearch } from "@/routes/_authenticated/student-management/enrollment/g1"
import type {
  ApplicationWithChild,
} from "@/lib/api-client/types.gen"

const LANE_CONFIG = [
  {
    status: "Pending",
    label: "Pending",
    badgeVariant: "secondary" as const,
    note: "Data entry in progress",
  },
  {
    status: "Completed",
    label: "Completed",
    badgeVariant: "default" as const,
    note: "Data entered, ready for marks",
  },
  {
    status: "PendingApproval",
    label: "Pending Approval",
    badgeVariant: "default" as const,
    note: "Awaiting officer approval",
  },
  {
    status: "Approved",
    label: "Approved",
    badgeVariant: "default" as const,
    note: "Approved",
  },
  {
    status: "Admitted",
    label: "Admitted",
    badgeVariant: "default" as const,
    note: "Formally admitted",
  },
  {
    status: "Rejected",
    label: "Rejected",
    badgeVariant: "destructive" as const,
    note: "Not selected",
  },
]

const CURRENT_YEAR = new Date().getFullYear()

const FILTER_KEYS = [
  "category",
  "enrollment_status",
] as const
const ENUM_KEYS = new Set([
  "category",
  "enrollment_status",
])

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

function ChildCombobox({
  value,
  search,
  onSearchChange,
  onChange,
  onCreateNew,
  onEdit,
}: {
  value: Child | null
  search: string
  onSearchChange: (v: string) => void
  onChange: (v: Child | null) => void
  onCreateNew: () => void
  onEdit: (child: Child) => void
}) {
  const debouncedSearch = useDebounce(search, 300)

  const { data: children = [] } = useQuery({
    queryKey: ["list-children", debouncedSearch],
    queryFn: async () => {
      const res = await listChildren({
        client: apiClient,
        query: { search: debouncedSearch || undefined },
      })
      return res.data ?? []
    },
  })

  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
          >
            {value
              ? `${value.full_name} (${value.date_of_birth})`
              : "Search child..."}
            <IconSearch className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="min-w-[--anchor-width] w-96 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by child name..."
            value={search}
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>No children found.</CommandEmpty>
            <CommandGroup>
              {children.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onChange(c)
                    setOpen(false)
                  }}
                  className="group"
                >
                  <div className="flex flex-1 flex-col">
                    <span>{c.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.name_with_initials} &middot; {c.date_of_birth}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpen(false)
                      onEdit(c)
                    }}
                  >
                    <IconPencil className="size-3.5" />
                  </Button>
                </CommandItem>
              ))}
              <CommandItem
                value="__create__"
                className="border-t border-border mt-1 pt-1 text-primary font-medium"
                onSelect={() => { setOpen(false); onCreateNew() }}
              >
                <IconUserPlus className="size-4" />
                <span>Create new child</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}



export function PipeDashboard() {
  const navigate = useNavigate({ from: Route.fullPath })
  const search: DashboardSearch = Route.useSearch()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [batchId, setBatchId] = useState("")
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [newEnrollmentOpen, setNewEnrollmentOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [childSearch, setChildSearch] = useState("")
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [createChildDialogOpen, setCreateChildDialogOpen] = useState(false)
  const [editingChild, setEditingChild] = useState<Child | null>(null)
  const batchIdRef = useRef(batchId)
  batchIdRef.current = batchId

  const { data: batches } = useQuery(listBatchesOptions({ client: apiClient }))

  const queryOptions = useMemo(
    () => ({
      client: apiClient,
      query: {
        page: search.page ?? undefined,
        page_size: search.page_size ?? undefined,
        sort_by: search.sort_by ?? undefined,
        sort_order: search.sort_order ?? undefined,
        category: search.category ?? undefined,
        enrollment_status: search.enrollment_status ?? undefined,
        batch_id: batchId || null,
      },
    }),
    [search, batchId]
  )

  const { data: enrollments } = useQuery({
    ...listApplicationsOptions(queryOptions),
    enabled: !!batchId,
  })
  const items = enrollments?.items ?? []
  const total = enrollments?.total ?? 0

  const grouped = LANE_CONFIG.reduce<Record<string, number>>((acc, lane) => {
    acc[lane.status] = items.filter(
      (e) => e.enrollment_status === lane.status
    ).length
    return acc
  }, {})



  const handleDelete = useCallback(async (rowId: string) => {
    setDeleting(true)
    try {
      await deleteApplication({ path: { id: rowId }, client: apiClient })
      setDeleteTarget(null)
      queryClient.invalidateQueries({
        queryKey: listApplicationsQueryKey({ client: apiClient }),
      })
      toast.success("Enrollment deleted")
    } catch (err) {
      toastApiError(err, "Delete failed")
    } finally {
      setDeleting(false)
    }
  }, [])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const sorting: SortingState = useMemo(() => {
    if (!search.sort_by) return []
    return [{ id: search.sort_by, desc: search.sort_order === "desc" }]
  }, [search.sort_by, search.sort_order])

  const columnFilters: ColumnFiltersState = useMemo(() => {
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

  const pagination: PaginationState = useMemo(
    () => ({
      pageIndex: Math.max(0, (search.page ?? 1) - 1),
      pageSize: search.page_size ?? 10,
    }),
    [search.page, search.page_size]
  )

  const handleColumnFiltersChange = useCallback(
    (
      updater:
        ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)
    ) => {
      const newFilters =
        typeof updater === "function" ? updater(columnFilters) : updater
      navigate({
        search: (prev) => {
          const next = { ...prev, page: 1 }
          for (const key of FILTER_KEYS) {
            const filter = newFilters.find((f) => f.id === key)
            if (filter) {
              const val = Array.isArray(filter.value)
                ? filter.value[0]
                : filter.value
              next[key] = val ? String(val) : undefined
            } else {
              next[key] = undefined
            }
          }
          return next
        },
      })
    },
    [columnFilters, navigate]
  )

  const handleSortingChange = useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater
      navigate({
        search: (prev) => {
          const next = { ...prev }
          if (newSorting.length === 0) {
            next.sort_by = undefined
            next.sort_order = undefined
          } else {
            const { id, desc } = newSorting[0]
            next.sort_by = id
            next.sort_order = desc ? "desc" : "asc"
          }
          return next
        },
      })
    },
    [sorting, navigate]
  )

  const handlePaginationChange = useCallback(
    (
      updater: PaginationState | ((prev: PaginationState) => PaginationState)
    ) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater
      navigate({
        search: (prev) => ({
          ...prev,
          page: newPagination.pageIndex + 1,
          page_size: newPagination.pageSize,
        }),
      })
    },
    [pagination, navigate]
  )

  const columns = useMemo<ColumnDef<ApplicationWithChild>[]>(
    () => [
      {
        accessorKey: "reference_no",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Reference" />
        ),
        enableColumnFilter: false,
        meta: { label: "Reference No", variant: "text" },
        cell: ({ getValue, row }) => {
          const ref = getValue() as string | null | undefined
          return (
            <button
              type="button"
              className="text-left font-medium transition-colors hover:text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation()
                navigate({
                  to: "/student-management/enrollment/g1/$enrollment_id",
                  params: { enrollment_id: row.original.id! },
                })
              }}
            >
              {ref || (
                <span className="text-sm text-muted-foreground italic">
                  No Reference
                </span>
              )}
            </button>
          )
        },
      },
      {
        accessorKey: "child_full_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Full Name" />
        ),
        enableColumnFilter: false,
        meta: { label: "Full Name", variant: "text" },
        cell: ({ getValue, row }) => {
          const name = getValue() as string | null | undefined
          return (
            <button
              type="button"
              className="text-left font-medium transition-colors hover:text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation()
                navigate({
                  to: "/student-management/enrollment/g1/$enrollment_id",
                  params: { enrollment_id: row.original.id! },
                })
              }}
            >
              {name || (
                <span className="text-sm text-muted-foreground italic">
                  Unnamed
                </span>
              )}
            </button>
          )
        },
      },
      {
        accessorKey: "child_name_with_initials",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Initials" />
        ),
        enableColumnFilter: false,
        meta: { label: "Name with Initials", variant: "text" },
        cell: ({ getValue }) => {
          const val = getValue() as string | null | undefined
          return val ? (
            <span>{val}</span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )
        },
      },
      {
        accessorKey: "child_date_of_birth",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="DOB" />
        ),
        enableColumnFilter: false,
        meta: { label: "Date of Birth" },
        cell: ({ getValue }) => {
          const val = getValue() as string | null
          return val ? formatDate(new Date(val + "T12:00:00")) : ""
        },
      },
      {
        accessorKey: "child_gender",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Gender" />
        ),
        enableColumnFilter: true,
        meta: {
          label: "Gender",
          variant: "select",
          options: [
            { label: "Male", value: "Male" },
            { label: "Female", value: "Female" },
          ],
        },
        cell: ({ getValue }) => (
          <EnumBadge column="gender" value={getValue() as string} />
        ),
      },
      {
        accessorKey: "child_nationality",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Nationality" />
        ),
        enableColumnFilter: true,
        meta: {
          label: "Nationality",
          variant: "select",
          options: [
            { label: "Sri Lankan", value: "SriLankan" },
            { label: "Dual Citizen", value: "DualCitizen" },
            { label: "Other", value: "Other" },
          ],
        },
        cell: ({ getValue }) => (
          <EnumBadge column="nationality" value={getValue() as string} />
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Category" />
        ),
        enableColumnFilter: true,
        meta: {
          label: "Category",
          variant: "select",
          options: [
            { label: "Close Resident", value: "CloseResident" },
            { label: "Past Pupil Child", value: "PastPupilChild" },
            { label: "Sibling", value: "Sibling" },
            { label: "MOE or UGC Staff Child", value: "MOEOrUGCStaffChild" },
            {
              label: "Government Transfer Officer Child",
              value: "GovernmentTransferOfficerChild",
            },
            { label: "Overseas Arrival", value: "OverseasArrival" },
            { label: "Armed Forces Reserved", value: "ArmedForcesReserved" },
          ],
        },
        cell: ({ getValue }) => (
          <EnumBadge column="category" value={getValue() as string} />
        ),
      },
      {
        accessorKey: "child_medium_of_instruction",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Medium" />
        ),
        enableColumnFilter: true,
        meta: {
          label: "Medium",
          variant: "select",
          options: [
            { label: "Sinhala", value: "Sinhala" },
            { label: "Tamil", value: "Tamil" },
          ],
        },
        cell: ({ getValue }) => (
          <EnumBadge column="medium_of_instruction" value={getValue() as string} />
        ),
      },
      {
        accessorKey: "enrollment_status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Status" />
        ),
        enableColumnFilter: true,
        meta: {
          label: "Status",
          variant: "select",
          options: [
            { label: "Pending", value: "Pending" },
            { label: "Completed", value: "Completed" },
            { label: "Pending Approval", value: "PendingApproval" },
            { label: "Approved", value: "Approved" },
            { label: "Admitted", value: "Admitted" },
            { label: "Rejected", value: "Rejected" },
            { label: "Withdrawn", value: "Withdrawn" },
            { label: "Removed", value: "Removed" },
          ],
        },
        cell: ({ getValue }) => (
          <EnumBadge column="enrollment_status" value={getValue() as string} />
        ),
      },
      {
        accessorKey: "total_marks",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Marks" />
        ),
        enableColumnFilter: false,
        meta: { label: "Marks" },
        cell: ({ getValue }) => {
          const val = getValue() as string | null | undefined
          if (!val) return <span className="text-muted-foreground">—</span>
          const num = parseFloat(val)
          if (num > 0) {
            const color =
              num >= 75
                ? "text-green-600"
                : num >= 50
                  ? "text-amber-600"
                  : "text-red-600"
            return (
              <span className={`font-semibold tabular-nums ${color}`}>
                {num.toFixed(2)}
              </span>
            )
          }
          return <span className="tabular-nums">{val}</span>
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Created" />
        ),
        enableColumnFilter: false,
        meta: { label: "Created" },
        cell: ({ getValue }) => {
          const val = getValue() as string | undefined
          return val ? (
            <span className="text-sm text-muted-foreground tabular-nums">
              {formatDate(new Date(val))}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="xs"
                    className="size-8 data-[state=open]:bg-accent"
                  >
                    <IconDots className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  className="gap-3 pl-3 [&_svg]:size-4"
                  onClick={() =>
                    navigate({
                      to: "/student-management/enrollment/g1/$enrollment_id",
                      params: { enrollment_id: row.original.id! },
                    })
                  }
                >
                  <IconExternalLink className="size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-3 pl-3 [&_svg]:size-4"
                  render={
                    <Link
                      to="/student-management/enrollment/g1/$enrollment_id"
                      params={{ enrollment_id: row.original.id! }}
                      className="flex items-center gap-3"
                    >
                      <IconPencil className="size-4" />
                      Configure
                    </Link>
                  }
                />
                <DropdownMenuItem
                  className="gap-3 pl-3 text-destructive focus:text-destructive [&_svg]:size-4"
                  onClick={() => setDeleteTarget(row.original.id!)}
                >
                  <IconTrash className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog
              open={deleteTarget === row.original.id}
              onOpenChange={(open) => {
                if (!open) setDeleteTarget(null)
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Enrollment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{" "}
                    {row.original.reference_no || "this enrollment"}? This action
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
                      <IconLoader2 className="size-4 animate-spin" />
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
    [navigate, deleteTarget, deleting, handleDelete]
  )

  const table = useReactTable({
    data: items,
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
    state: { sorting, columnFilters, columnVisibility, pagination },
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="px-0.5 text-xs text-muted-foreground">Batch</Label>
        <ScrollArea className="w-full">
          <div ref={scrollRef} className="flex min-w-max gap-2 pb-1">
            {(batches ?? []).map((b: any) => {
              const isActive = b.id === batchId
              const miniWeights = [
                {
                  key: "proximity",
                  value: String(b.proximity_percentage ?? 50),
                  color: "bg-blue-500",
                },
                {
                  key: "staff",
                  value: String(b.staff_percentage ?? 25),
                  color: "bg-emerald-500",
                },
                {
                  key: "sibling",
                  value: String(b.sibling_percentage ?? 14),
                  color: "bg-violet-500",
                },
                {
                  key: "alumni",
                  value: String(b.alumni_percentage ?? 6),
                  color: "bg-amber-500",
                },
                {
                  key: "govt",
                  value: String(b.govt_percentage ?? 4),
                  color: "bg-rose-500",
                },
                {
                  key: "special",
                  value: String(b.special_percentage ?? 1),
                  color: "bg-cyan-500",
                },
              ]
              const miniTotalW = miniWeights.reduce(
                (s, w) => s + (parseInt(w.value) || 0),
                0
              )
              const miniSegments = miniWeights.filter(
                (w) => (parseInt(w.value) || 0) > 0
              )
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setBatchId(b.id)
                    b.id &&
                      scrollRef.current
                        ?.querySelector(`[data-batch-id="${b.id}"]`)
                        ?.scrollIntoView({
                          behavior: "smooth",
                          inline: "start",
                          block: "nearest",
                        })
                  }}
                  className={`flex min-w-52 shrink-0 items-start gap-3 rounded-xl border px-5 py-3 text-left transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40 hover:bg-accent/40"
                  }`}
                  data-batch-id={b.id}
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold">{b.year}</span>
                      <span
                        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${getEnumStyle("batch_status", b.status) ?? "border-border bg-muted text-muted-foreground"}`}
                      >
                        {getEnumLabel("batch_status", b.status)}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {b.student_allocation ?? 0} seats
                    </div>
                    <div className="flex h-3 w-full overflow-hidden rounded-full">
                      {miniSegments.map((w: any) => {
                        const pct = (parseInt(w.value) || 0) / miniTotalW
                        return (
                          <div
                            key={w.key}
                            className={`${w.color}`}
                            style={{ width: `${pct * 100}%` }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setBatchDialogOpen(true)}
              className="flex min-w-52 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-border px-5 py-3 text-sm text-muted-foreground transition-all hover:border-primary/50 hover:text-primary"
            >
              <IconFolderPlus className="size-5" />
              New Batch
            </button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Grade 1 Admissions Pipeline
        </h1>
        <Button onClick={() => setNewEnrollmentOpen(true)}>
          <IconPlus className="mr-2 size-4" /> New Enrollment
        </Button>
      </div>

      {batchId ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
            {LANE_CONFIG.map((lane) => {
              const count = grouped[lane.status] ?? 0
              return (
                <div
                  key={lane.status}
                  className="min-w-0 rounded-xl border bg-card p-4"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Badge variant={lane.badgeVariant} className="truncate">{lane.label}</Badge>
                    <span className="shrink-0 text-2xl font-bold tabular-nums">
                      {count}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {lane.note}
                  </p>
                </div>
              )
            })}
          </div>

          <DataTable table={table}>
            <DataTableToolbar table={table} />
          </DataTable>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <IconFolderPlus className="mb-4 size-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            No Batch Selected
          </h3>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Select a batch above to view its enrollment pipeline.
          </p>
        </div>
      )}

      <CreateBatchDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        onSuccess={(batch) => {
          queryClient.invalidateQueries({
            queryKey: listBatchesQueryKey({ client: apiClient }),
          })
          if (batch?.id) setBatchId(batch.id)
        }}
        defaultYear={CURRENT_YEAR}
      />

      <Dialog open={newEnrollmentOpen} onOpenChange={(open) => {
        if (!open) { setNewEnrollmentOpen(false); setChildSearch(""); setSelectedChild(null) }
      }}>
        <DialogContent className="sm:max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>New Enrollment</DialogTitle>
            <DialogDescription>
              Create a new G1 enrollment application for the selected batch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Batch</Label>
              {batchId ? (
                <div className="flex items-center rounded-md border bg-muted px-3 py-2 text-sm">
                  {batches?.find((b) => b.id === batchId)?.batch_name || "No batch selected"}
                </div>
              ) : (
                <Select value={batchId} onValueChange={setBatchId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {(batches ?? []).map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.batch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Child</Label>
              <ChildCombobox
                  value={selectedChild}
                  search={childSearch}
                  onSearchChange={setChildSearch}
                  onChange={setSelectedChild}
                  onCreateNew={() => setCreateChildDialogOpen(true)}
                  onEdit={(child) => { setEditingChild(child); setCreateChildDialogOpen(true) }}
                />
              {selectedChild && (
                <p className="text-xs text-muted-foreground">
                  {selectedChild.full_name} &middot; {selectedChild.date_of_birth}
                </p>
              )}
            </div>

            <FormBuilder<{ school_id: string }>
              config={{
                fields: [
                  {
                    name: "school_id",
                    kind: "custom",
                    label: "School (optional)",
                    customRenderer: ({ value, onChange }) => (
                      <SchoolCombobox
                        value={(value as string) || null}
                        onChange={(v) => onChange(v ?? "")}
                      />
                    ),
                  },
                ],
                layout: [{ columns: [{ fields: ["school_id"] }] }],
                submitLabel: "Create",
                cancelLabel: "Cancel",
                onCancel: () => {
                  setNewEnrollmentOpen(false)
                  setChildSearch("")
                  setSelectedChild(null)
                },
              }}
              defaultValues={{ school_id: "" }}
              formId="new-enrollment-form"
              onSubmit={async (value) => {
                const currentBatchId = batchIdRef.current
                if (!currentBatchId || !selectedChild) return
                setCreating(true)
                try {
                  const { data, error } = await createApplication({
                    body: {
                      batch_id: currentBatchId,
                      child_id: selectedChild.id,
                      school_id: value.school_id || undefined,
                    },
                    client: apiClient,
                  })
                  if (error) {
                    toastApiError(error, "Failed to create enrollment")
                    return
                  }
                  toast.success(`${selectedChild?.full_name ?? "Child"} enrolled. Fill in remaining details.`)
                  setNewEnrollmentOpen(false)
                  setChildSearch("")
                  setSelectedChild(null)
                  await queryClient.invalidateQueries({
                    queryKey: listApplicationsQueryKey({ client: apiClient }),
                  })
                  if (!data?.id) {
                    toastApiError("Failed to create enrollment")
                    return
                  }
                  navigate({
                    to: "/student-management/enrollment/g1/$enrollment_id",
                    params: { enrollment_id: data.id },
                  })
                } catch (err) {
                  toastApiError(err, "Failed to create enrollment")
                } finally {
                  setCreating(false)
                }
              }}
              hideDefaultButtons
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => { setNewEnrollmentOpen(false); setChildSearch(""); setSelectedChild(null) }}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="new-enrollment-form"
              disabled={!batchId || creating || !selectedChild}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createChildDialogOpen} onOpenChange={(open) => { if (!open) setEditingChild(null); setCreateChildDialogOpen(open) }}>
        <DialogContent className="sm:max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>{editingChild ? "Edit Child" : "Create New Child"}</DialogTitle>
            <DialogDescription>
              {editingChild ? "Update the child's details." : "Enter the required details to create a new child record."}
            </DialogDescription>
          </DialogHeader>
          <CreateChildForm
            child={editingChild}
            onSuccess={(child) => {
              setSelectedChild(child)
              setCreateChildDialogOpen(false)
              setEditingChild(null)
            }}
          />
        </DialogContent>
      </Dialog>

    </div>
  )
}




