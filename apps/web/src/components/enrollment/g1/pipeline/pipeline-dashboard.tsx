"use client"

import { useForm } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, Link } from "@tanstack/react-router"
import { useState, useRef, useMemo, useCallback } from "react"
import * as v from "valibot"
import {
  IconPlus,
  IconFolderPlus,
  IconCalendar,
  IconPencil,
  IconTrash,
  IconLoader2,
  IconDots,
  IconExternalLink,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import {
  listBatchesOptions,
  listBatchesQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import {
  listApplicationsOptions,
  listApplicationsQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import {
  createApplication,
  createBatch,
  deleteApplication,
} from "@/lib/api-client/sdk.gen"
import { queryClient } from "@/router"
import {
  vGender,
  vNationality,
  vMediumOfInstruction,
  vReligion,
} from "@/lib/api-client/valibot.gen"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { formatDate } from "@/lib/format"
import { getEnumLabel, getEnumStyle } from "@/lib/enum-badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
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
import type { G1Application } from "@/lib/api-client/types.gen"

const vDialogApplication = v.object({
  full_name: v.string(),
  name_with_initials: v.string(),
  date_of_birth: v.pipe(v.string(), v.isoDate()),
  gender: vGender,
  nationality: vNationality,
  medium_of_instruction: vMediumOfInstruction,
  religion: vReligion,
})

const WEIGHT_INFO: Record<string, { label: string; desc: string }> = {
  proximity: {
    label: "Proximity",
    desc: "Priority for children living closest to the school",
  },
  staff: {
    label: "Staff",
    desc: "Children of staff members employed at the school",
  },
  sibling: {
    label: "Sibling",
    desc: "Children with siblings already enrolled at the school",
  },
  alumni: {
    label: "Alumni",
    desc: "Children of former graduates of the school",
  },
  govt: {
    label: "Govt",
    desc: "Children of government employees transferred to the area",
  },
  special: {
    label: "Special",
    desc: "Children with special needs or exceptional circumstances",
  },
}

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
  "full_name",
  "name_with_initials",
  "gender",
  "nationality",
  "category",
  "medium_of_instruction",
  "enrollment_status",
] as const
const ENUM_KEYS = new Set([
  "gender",
  "nationality",
  "category",
  "medium_of_instruction",
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

export function PipeDashboard() {
  const navigate = useNavigate({ from: Route.fullPath })
  const search: DashboardSearch = Route.useSearch()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [batchId, setBatchId] = useState("")
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { data: batches } = useQuery(listBatchesOptions({ client: apiClient }))

  const queryOptions = useMemo(
    () => ({
      client: apiClient,
      query: {
        page: search.page ?? undefined,
        page_size: search.page_size ?? undefined,
        sort_by: search.sort_by ?? undefined,
        sort_order: search.sort_order ?? undefined,
        full_name: search.full_name ?? undefined,
        name_with_initials: search.name_with_initials ?? undefined,
        gender: search.gender ?? undefined,
        nationality: search.nationality ?? undefined,
        category: search.category ?? undefined,
        medium_of_instruction: search.medium_of_instruction ?? undefined,
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

  const enrollmentForm = useForm({
    defaultValues: {
      full_name: "",
      name_with_initials: "",
      date_of_birth: "",
      gender: "Male",
      nationality: "SriLankan",
      medium_of_instruction: "Sinhala",
      religion: "Buddhism",
    },
    validators: { onSubmit: vDialogApplication },
    onSubmit: async ({ value }) => {
      if (!batchId) return
      const { data, error } = await createApplication({
        body: { ...value, batch_id: batchId } as G1Application,
        client: apiClient,
      })
      if (error || !data) {
        toast.error(
          (error as { message?: string })?.message ??
            "Failed to create enrollment"
        )
        return
      }
      toast.success("Enrollment created. Complete all details.")
      setNewDialogOpen(false)
      enrollmentForm.reset()
      queryClient.invalidateQueries({
        queryKey: listApplicationsQueryKey({ client: apiClient }),
      })
      navigate({
        to: "/student-management/enrollment/g1/$enrollment_id",
        params: { enrollment_id: data.id! },
      })
    },
  })

  const batchForm = useForm({
    defaultValues: {
      year: CURRENT_YEAR,
      enrollment_type: "G1" as const,
      student_allocation: 200,
      proximity_weight: 50,
      staff_weight: 25,
      sibling_weight: 14,
      alumni_weight: 6,
      govt_weight: 4,
      special_weight: 1,
    },
    onSubmit: async ({ value }) => {
      try {
        const r = await createBatch({ body: value, client: apiClient })
        const newBatchId = r.data?.id ?? (r.data as any)?.id
        toast.success("Batch created")
        setBatchDialogOpen(false)
        batchForm.reset()
        await queryClient.invalidateQueries({
          queryKey: listBatchesQueryKey({ client: apiClient }),
        })
        if (newBatchId) setBatchId(newBatchId)
      } catch {
        toast.error("Failed to create batch")
      }
    },
  })

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
      toast.error(err instanceof Error ? err.message : "Delete failed")
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

  const columns = useMemo<ColumnDef<G1Application>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Full Name" />
        ),
        enableColumnFilter: true,
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
        accessorKey: "name_with_initials",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Initials" />
        ),
        enableColumnFilter: true,
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
        accessorKey: "date_of_birth",
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
        accessorKey: "gender",
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
        accessorKey: "nationality",
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
        accessorKey: "medium_of_instruction",
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
          <EnumBadge
            column="medium_of_instruction"
            value={getValue() as string}
          />
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
                  value: String(b.proximity_weight ?? 50),
                  color: "bg-blue-500",
                },
                {
                  key: "staff",
                  value: String(b.staff_weight ?? 25),
                  color: "bg-emerald-500",
                },
                {
                  key: "sibling",
                  value: String(b.sibling_weight ?? 14),
                  color: "bg-violet-500",
                },
                {
                  key: "alumni",
                  value: String(b.alumni_weight ?? 6),
                  color: "bg-amber-500",
                },
                {
                  key: "govt",
                  value: String(b.govt_weight ?? 4),
                  color: "bg-rose-500",
                },
                {
                  key: "special",
                  value: String(b.special_weight ?? 1),
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
                    setBatchId(b.id!)
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
        <Button onClick={() => setNewDialogOpen(true)} disabled={!batchId}>
          <IconPlus className="mr-2 size-4" />{" "}
          {batchId ? "New Enrollment" : "Select Batch"}
        </Button>
      </div>

      {batchId ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {LANE_CONFIG.map((lane) => {
              const count = grouped[lane.status] ?? 0
              return (
                <div
                  key={lane.status}
                  className="rounded-xl border bg-card p-4"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <Badge variant={lane.badgeVariant}>{lane.label}</Badge>
                    <span className="text-2xl font-bold tabular-nums">
                      {count}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
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

      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Batch</DialogTitle>
            <DialogDescription>
              Set up a new G1 admission batch with allocation and scoring
              weights.
            </DialogDescription>
          </DialogHeader>
          <form
            id="create-batch-form"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              batchForm.handleSubmit()
            }}
          >
            <FieldGroup>
              <batchForm.Field
                name="year"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Year</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        aria-invalid={isInvalid}
                        placeholder="2026"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
              <batchForm.Field
                name="student_allocation"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Total Student Allocation
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />

              <div className="space-y-3">
                <Label>Weight Distribution</Label>

                <batchForm.Subscribe
                  selector={(state: any) => ({
                    student_allocation: state.values.student_allocation ?? 0,
                    proximity_weight: state.values.proximity_weight ?? 0,
                    staff_weight: state.values.staff_weight ?? 0,
                    sibling_weight: state.values.sibling_weight ?? 0,
                    alumni_weight: state.values.alumni_weight ?? 0,
                    govt_weight: state.values.govt_weight ?? 0,
                    special_weight: state.values.special_weight ?? 0,
                  })}
                  children={(vals: any) => {
                    const weights = [
                      {
                        key: "proximity",
                        value: String(vals.proximity_weight),
                        color: "bg-blue-500",
                      },
                      {
                        key: "staff",
                        value: String(vals.staff_weight),
                        color: "bg-emerald-500",
                      },
                      {
                        key: "sibling",
                        value: String(vals.sibling_weight),
                        color: "bg-violet-500",
                      },
                      {
                        key: "alumni",
                        value: String(vals.alumni_weight),
                        color: "bg-amber-500",
                      },
                      {
                        key: "govt",
                        value: String(vals.govt_weight),
                        color: "bg-rose-500",
                      },
                      {
                        key: "special",
                        value: String(vals.special_weight),
                        color: "bg-cyan-500",
                      },
                    ]
                    return (
                      <>
                        <WeightBar
                          weights={weights}
                          totalAllocation={vals.student_allocation}
                        />

                        <div className="space-y-1.5">
                          {(
                            [
                              {
                                key: "proximity",
                                label: "proximity_weight",
                                color: "bg-blue-500",
                              },
                              {
                                key: "staff",
                                label: "staff_weight",
                                color: "bg-emerald-500",
                              },
                              {
                                key: "sibling",
                                label: "sibling_weight",
                                color: "bg-violet-500",
                              },
                              {
                                key: "alumni",
                                label: "alumni_weight",
                                color: "bg-amber-500",
                              },
                              {
                                key: "govt",
                                label: "govt_weight",
                                color: "bg-rose-500",
                              },
                              {
                                key: "special",
                                label: "special_weight",
                                color: "bg-cyan-500",
                              },
                            ] as const
                          ).map((w: any) => {
                            const info = WEIGHT_INFO[w.key]
                            const weight = vals[w.label]
                            const totalWeight =
                              vals.proximity_weight +
                              vals.staff_weight +
                              vals.sibling_weight +
                              vals.alumni_weight +
                              vals.govt_weight +
                              vals.special_weight
                            const pct =
                              totalWeight > 0
                                ? ((weight / totalWeight) * 100).toFixed(0)
                                : "0"
                            const seats =
                              totalWeight > 0
                                ? Math.round(
                                    (weight / totalWeight) *
                                      vals.student_allocation
                                  )
                                : 0
                            return (
                              <Tooltip key={w.key}>
                                <TooltipTrigger
                                  render={
                                    <div className="flex cursor-help items-center gap-2" />
                                  }
                                >
                                  <div
                                    className={`size-3 shrink-0 rounded-full ${w.color}`}
                                  />
                                  <span className="w-14 text-xs text-muted-foreground">
                                    {info.label}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      className="flex size-6 items-center justify-center rounded border border-input text-xs hover:bg-accent disabled:opacity-30"
                                      disabled={weight <= 0}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        batchForm.setFieldValue(
                                          w.label,
                                          Math.max(0, weight - 1)
                                        )
                                      }}
                                    >
                                      −
                                    </button>
                                    <span className="w-8 text-center font-mono text-sm tabular-nums">
                                      {weight}
                                    </span>
                                    <button
                                      type="button"
                                      className="flex size-6 items-center justify-center rounded border border-input text-xs hover:bg-accent"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        batchForm.setFieldValue(
                                          w.label,
                                          weight + 1
                                        )
                                      }}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="flex-1" />
                                  <span className="text-xs text-muted-foreground tabular-nums">
                                    {pct}%
                                  </span>
                                  <span className="w-16 text-right text-xs font-medium tabular-nums">
                                    {seats} seats
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="left"
                                  className="max-w-64"
                                >
                                  <p className="font-medium">{info.label}</p>
                                  <p className="text-[11px] opacity-80">
                                    {info.desc}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                      </>
                    )
                  }}
                />
              </div>
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-batch-form">
              Create Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-h-[75vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Enrollment</DialogTitle>
            <DialogDescription>
              Fill in the child's details to create a PENDING enrollment.
            </DialogDescription>
          </DialogHeader>
          <form
            id="new-enrollment-form"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              enrollmentForm.handleSubmit()
            }}
          >
            <FieldGroup>
              <enrollmentForm.Field
                name="full_name"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="John Doe"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
              <enrollmentForm.Field
                name="name_with_initials"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Name with Initials
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="J. Doe"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
              <enrollmentForm.Field
                name="date_of_birth"
                children={(field: any) => {
                  const dateValue = field.state.value
                    ? new Date(field.state.value + "T12:00:00")
                    : undefined
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Date of Birth
                      </FieldLabel>
                      <Popover>
                        <PopoverTrigger
                          id={field.name}
                          aria-invalid={isInvalid}
                          render={
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <IconCalendar className="mr-2 size-4 shrink-0" />
                              {dateValue ? (
                                formatDate(dateValue)
                              ) : (
                                <span className="text-muted-foreground">
                                  Pick a date
                                </span>
                              )}
                            </Button>
                          }
                        />
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateValue}
                            defaultMonth={dateValue}
                            onSelect={(d) => {
                              if (!d) {
                                field.handleChange("")
                                return
                              }
                              const y = d.getFullYear()
                              const m = String(d.getMonth() + 1).padStart(
                                2,
                                "0"
                              )
                              const day = String(d.getDate()).padStart(2, "0")
                              field.handleChange(`${y}-${m}-${day}`)
                            }}
                            captionLayout="dropdown"
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
              <enrollmentForm.Field
                name="gender"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Gender</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(val) => val && field.handleChange(val)}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Male", "Female"].map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
              <enrollmentForm.Field
                name="nationality"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Nationality</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(val) => val && field.handleChange(val)}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["SriLankan", "DualCitizen", "Other"].map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
              <enrollmentForm.Field
                name="medium_of_instruction"
                children={(field: any) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Medium of Instruction
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(val) => val && field.handleChange(val)}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Sinhala", "Tamil"].map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="new-enrollment-form">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function WeightBar({
  weights,
  totalAllocation,
}: {
  weights: { key: string; value: string; color: string }[]
  totalAllocation: number
}) {
  const totalWeight = weights.reduce((s, w) => s + (parseInt(w.value) || 0), 0)
  const segments = weights.filter((w) => (parseInt(w.value) || 0) > 0)

  return (
    <div className="space-y-2">
      <div className="flex h-8 w-full overflow-hidden rounded-md border">
        {segments.length === 0 ? (
          <div className="flex flex-1 items-center justify-center bg-muted text-[10px] text-muted-foreground">
            No weights set
          </div>
        ) : (
          segments.map((w) => {
            const info = WEIGHT_INFO[w.key]
            const pct = (parseInt(w.value) || 0) / totalWeight
            const seats =
              totalWeight > 0 ? Math.round(pct * totalAllocation) : 0
            return (
              <Tooltip key={w.key}>
                <TooltipTrigger
                  className={`${w.color} flex cursor-help items-center justify-center truncate px-0.5 text-[10px] font-medium text-white transition-all`}
                  style={{ width: `${pct * 100}%` }}
                >
                  {pct > 0.08 ? `${(pct * 100).toFixed(0)}%` : ""}
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="font-medium">{info.label}</p>
                  <p className="text-[11px] opacity-80">{info.desc}</p>
                  <p className="mt-1 text-[11px] opacity-70">
                    {w.value} pts — {seats} seats
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((w) => {
          const info = WEIGHT_INFO[w.key]
          const pct = (parseInt(w.value) || 0) / totalWeight
          const seats = totalWeight > 0 ? Math.round(pct * totalAllocation) : 0
          return (
            <Tooltip key={w.key}>
              <TooltipTrigger className="flex cursor-help items-center gap-1 text-[10px] text-muted-foreground">
                <div className={`size-2 rounded-full ${w.color}`} />
                <span>{info.label}</span>
                <span className="font-medium tabular-nums">{seats}</span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{info.label}</p>
                <p className="text-[11px] opacity-80">{info.desc}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
