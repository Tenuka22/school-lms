import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"
import G1Datagrid from "@/components/enrollment/g1/g1-data-grid"
import { DataTableSkeleton } from "@/components/ui/data-table/data-table-skeleton"
import * as v from "valibot"

const searchSchema = v.object({
  page: v.optional(v.pipe(v.union([v.string(), v.number()]), v.transform(Number)), "1"),
  page_size: v.optional(v.pipe(v.union([v.string(), v.number()]), v.transform(Number)), "10"),
  sort_by: v.optional(v.string()),
  sort_order: v.optional(v.string()),
  full_name: v.optional(v.string()),
  name_with_initials: v.optional(v.string()),
  gender: v.optional(v.string()),
  nationality: v.optional(v.string()),
  category: v.optional(v.string()),
  medium_of_instruction: v.optional(v.string()),
  enrollment_status: v.optional(v.string()),
})

export type G1SearchParams = v.InferOutput<typeof searchSchema>

export const Route = createFileRoute("/_authenticated/student-management/enrollment/g1")({
  validateSearch: (search) => v.parse(searchSchema, search),
  component: RouteComponent,
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <Suspense
      fallback={<DataTableSkeleton columnCount={8} rowCount={10} filterCount={3} />}
    >
      <G1Datagrid search={search} navigate={navigate} />
    </Suspense>
  )
}
