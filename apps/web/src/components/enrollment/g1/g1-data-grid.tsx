import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import * as React from "react"
import { LoaderCircle, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import logger from "@/lib/logger"
import {
  listEnrollmentsOptions,
  listEnrollmentsQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { createEnrollment, deleteEnrollment, updateEnrollment } from "@/lib/api-client/sdk.gen"
import {
  G1CategorySchema,
  GenderSchema,
  MediumOfInstructionSchema,
  NationalitySchema,
  EnrollmentStatusSchema,
} from "@/lib/api-client/schemas.gen"
import type { G1Enrollment, ListEnrollmentsResponse } from "@/lib/api-client/types.gen"
import { useDataGrid } from "@/hooks/use-data-grid"
import { DataGrid } from "@/components/ui/data-grid/data-grid"
import { DataGridKeyboardShortcuts } from "@/components/ui/data-grid/data-grid-keyboard-shortcuts"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const queryOptions = listEnrollmentsOptions({ client: apiClient })

const LABELS: Record<string, string> = {
  CloseResident: "Close Resident",
  PastPupilChild: "Past Pupil Child",
  Sibling: "Sibling",
  MOEOrUGCStaffChild: "MOE or UGC Staff Child",
  GovernmentTransferOfficerChild: "Government Transfer Officer Child",
  OverseasArrival: "Overseas Arrival",
  ArmedForcesReserved: "Armed Forces Reserved",
  Male: "Male",
  Female: "Female",
  Sinhala: "Sinhala",
  Tamil: "Tamil",
  SriLankan: "Sri Lankan",
  DualCitizen: "Dual Citizen",
  Other: "Other",
  Buddhism: "Buddhism",
  Hinduism: "Hinduism",
  Islam: "Islam",
  Christianity: "Christianity",
  Catholicism: "Catholicism",
  Draft: "Draft",
  Pending: "Pending",
  ProvisionallyApproved: "Provisionally Approved",
  Approved: "Approved",
  Rejected: "Rejected",
  Withdrawn: "Withdrawn",
  Removed: "Removed",
}

const toOptions = (values: readonly string[]) =>
  values.map((v) => ({ label: LABELS[v] ?? v, value: v }))

type RowStatus =
  | { kind: "new" }
  | { kind: "saving" }
  | { kind: "error"; message: string }

interface G1GridMeta {
  rowStatus: Map<string, RowStatus>
  onSave: (rowId: string, rowData: G1Enrollment, isNew: boolean) => void
  onDelete: (rowId: string) => void
}

const EMPTY_ROW_STATUS: Map<string, RowStatus> = new Map()

function makeEmptyRow(): G1Enrollment {
  return {
    batch_id: "",
    category: "CloseResident",
    date_of_birth: "",
    full_name: "",
    gender: "Male",
    medium_of_instruction: "Sinhala",
    name_with_initials: "",
    nationality: "SriLankan",
    enrollment_status: "Draft",
    id: crypto.randomUUID(),
  }
}

const columns: ColumnDef<G1Enrollment>[] = [
  { id: "full_name", accessorKey: "full_name", header: "Full Name", meta: { cell: { variant: "short-text" } }, minSize: 180 },
  { id: "name_with_initials", accessorKey: "name_with_initials", header: "Name with Initials", meta: { cell: { variant: "short-text" } }, minSize: 180 },
  { id: "date_of_birth", accessorKey: "date_of_birth", header: "Date of Birth", meta: { cell: { variant: "date", pastYears: 100, futureYears: 0 } }, minSize: 130 },
  { id: "gender", accessorKey: "gender", header: "Gender", meta: { cell: { variant: "select", options: toOptions(GenderSchema.enum) } }, minSize: 100 },
  { id: "nationality", accessorKey: "nationality", header: "Nationality", meta: { cell: { variant: "select", options: toOptions(NationalitySchema.enum) } }, minSize: 120 },
  { id: "category", accessorKey: "category", header: "Category", meta: { cell: { variant: "select", options: toOptions(G1CategorySchema.enum) } }, minSize: 150 },
  { id: "medium_of_instruction", accessorKey: "medium_of_instruction", header: "Medium", meta: { cell: { variant: "select", options: toOptions(MediumOfInstructionSchema.enum) } }, minSize: 120 },
  { id: "enrollment_status", accessorKey: "enrollment_status", header: "Status", meta: { cell: { variant: "select", options: toOptions(EnrollmentStatusSchema.enum) } }, minSize: 120 },
  { id: "batch_id", accessorKey: "batch_id", header: "Batch", minSize: 200, meta: { cell: { variant: "batch-select" } } },
  {
    id: "actions",
    header: "",
    minSize: 80,
    maxSize: 120,
    cell: ({ row, table }) => {
      const meta = table.options.meta as G1GridMeta
      const status = meta.rowStatus.get(row.id)
      logger.debug(
        { rowId: row.id, name: row.original.name_with_initials, full_name: row.original.full_name },
        "ActionsCell: rendering",
      )
      return (
        <ActionsCell
          status={status}
          onSave={() => {
            logger.debug(
              { rowId: row.id, name: row.original.name_with_initials, full_name: row.original.full_name },
              "ActionsCell: onSave clicked",
            )
            meta.onSave(row.id, row.original, status?.kind === "new")
          }}
          onDelete={() => meta.onDelete(row.id)}
        />
      )
    },
  },
]

const G1Datagrid = () => {
  const { data: enrollments } = useSuspenseQuery(queryOptions)
  const [rows, setRows] = React.useState<G1Enrollment[]>(enrollments)
  const [rowStatus, setRowStatus] = React.useState<Map<string, RowStatus>>(EMPTY_ROW_STATUS)
  const queryClient = useQueryClient()
  const errorTimeoutsRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  React.useEffect(() => {
    logger.info({ count: enrollments.length }, "G1Datagrid: initial data loaded from API")
  }, [enrollments])

  React.useEffect(() => {
    return () => {
      for (const timer of errorTimeoutsRef.current.values()) clearTimeout(timer)
    }
  }, [])

  const setStatus = React.useCallback((rowId: string, status: RowStatus | undefined) => {
    setRowStatus((prev) => {
      const next = new Map(prev)
      if (status) next.set(rowId, status)
      else next.delete(rowId)
      return next
    })
  }, [])

  const clearErrorTimeout = React.useCallback((rowId: string) => {
    const existing = errorTimeoutsRef.current.get(rowId)
    if (existing) {
      clearTimeout(existing)
      errorTimeoutsRef.current.delete(rowId)
    }
  }, [])

  const handleSave = React.useCallback(
    async (rowId: string, rowData: G1Enrollment, isNew: boolean) => {
      clearErrorTimeout(rowId)
      setStatus(rowId, { kind: "saving" })

      logger.info({ rowId, isNew, name: rowData.full_name }, "handleSave: starting save")

      try {
        if (isNew) {
          logger.info({ body: rowData }, "handleSave: calling createEnrollment")
          const { data } = await createEnrollment({ body: rowData, client: apiClient })
          logger.info({ data }, "handleSave: createEnrollment response")

          const updatedRow = { ...rowData, ...data }
          logger.info({ rowId, updatedRowId: updatedRow.id }, "handleSave: create success, updating local state")

          setRows((prev) => prev.map((r) => (r.id === rowId ? updatedRow : r)))
          queryClient.setQueryData(
            listEnrollmentsQueryKey(),
            (old: ListEnrollmentsResponse | undefined) => [...(old ?? []), updatedRow],
          )
          setStatus(rowId, undefined)
        } else {
          logger.info(
            {
              rowId,
              body_name: rowData.name_with_initials,
              body_full_name: rowData.full_name,
              body_enrollment_status: rowData.enrollment_status,
            },
            "handleSave: calling updateEnrollment",
          )
          const { data } = await updateEnrollment({ body: rowData, path: { id: rowId }, client: apiClient })
          logger.info(
            { rowId, data_name: data?.name_with_initials, data_full_name: data?.full_name },
            "handleSave: updateEnrollment response",
          )

          const updatedRow = { ...rowData, ...data }
          logger.info({ rowId, updatedRow }, "handleSave: update success, updating local state")

          setRows((prev) => prev.map((r) => (r.id === rowId ? updatedRow : r)))
          queryClient.setQueryData(
            listEnrollmentsQueryKey(),
            (old: ListEnrollmentsResponse | undefined) =>
              old?.map((e) => (e.id === rowId ? updatedRow : e)),
          )
          setStatus(rowId, undefined)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Save failed"
        logger.error({ err, rowId, isNew }, "handleSave: error caught")
        toast.error(message)
        setStatus(rowId, { kind: "error", message })
        errorTimeoutsRef.current.set(
          rowId,
          setTimeout(() => {
            setStatus(rowId, undefined)
            errorTimeoutsRef.current.delete(rowId)
          }, 2000),
        )
      }
    },
    [queryClient, setStatus, clearErrorTimeout],
  )

  const handleDelete = React.useCallback(
    async (rowId: string) => {
      clearErrorTimeout(rowId)
      setStatus(rowId, { kind: "saving" })

      logger.info({ rowId }, "handleDelete: starting delete")

      try {
        await deleteEnrollment({ path: { id: rowId }, client: apiClient })
        logger.info({ rowId }, "handleDelete: API success, removing from local state")
        setRows((prev) => prev.filter((r) => r.id !== rowId))
        setStatus(rowId, undefined)
        queryClient.setQueryData(
          listEnrollmentsQueryKey(),
          (old: ListEnrollmentsResponse | undefined) => old?.filter((r) => r.id !== rowId),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : "Delete failed"
        logger.error({ err, rowId }, "handleDelete: error caught")
        toast.error(message)
        setStatus(rowId, undefined)
      }
    },
    [queryClient, setStatus, clearErrorTimeout],
  )

  const onRowAdd = React.useCallback(() => {
    const newRow = makeEmptyRow()
    setRows((prev) => [...prev, newRow])
    setStatus(newRow.id!, { kind: "new" })
    return {}
  }, [setStatus])

  const onDataChange = React.useCallback((data: G1Enrollment[]) => {
    const changed = data.find(
      (d, i) => d.name_with_initials !== rows[i]?.name_with_initials || d.full_name !== rows[i]?.full_name,
    )
    logger.info(
      { prevCount: rows.length, newCount: data.length, changed_name: changed?.name_with_initials },
      "onDataChange: rows updated from grid edit",
    )
    setRows(data)
  }, [rows.length])

  const meta = React.useMemo<G1GridMeta>(
    () => ({ rowStatus, onSave: handleSave, onDelete: handleDelete }),
    [rowStatus, handleSave, handleDelete],
  )

  const isSaving = React.useMemo(
    () => [...rowStatus.values()].some((s) => s.kind === "saving"),
    [rowStatus],
  )

  const { table, ...dataGridProps } = useDataGrid({
    columns,
    data: rows,
    getRowId: (row) => row.id!,
    enablePaste: true,
    meta: meta as any,
    onRowAdd,
    onDataChange,
    readOnly: isSaving,
  })

  return (
    <>
      <DataGridKeyboardShortcuts enableSearch />
      <DataGrid {...dataGridProps} table={table} height={500} />
    </>
  )
}

function ActionsCell({
  status,
  onSave,
  onDelete,
}: {
  status: RowStatus | undefined
  onSave: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const isNew = status?.kind === "new"

  if (status?.kind === "saving") {
    return (
      <div className="flex size-full items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (status?.kind === "error") {
    return (
      <div className="flex size-full items-center justify-center">
        <Button variant="destructive" onClick={onSave} className="w-full" size="sm">
          <RefreshCw className="size-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="sm" className="w-full">
          <span className="flex-1 text-left">Actions</span>
          <MoreHorizontal className="size-4 shrink-0" />
        </Button>
      }>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onSave}>
          {isNew ? "Save" : "Update"}
        </DropdownMenuItem>
        {!isNew && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default G1Datagrid
