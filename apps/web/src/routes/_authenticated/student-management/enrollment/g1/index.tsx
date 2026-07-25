import { createFileRoute } from "@tanstack/react-router"
import { PipeDashboard } from "@/components/enrollment/g1/pipeline/pipeline-dashboard"

export interface DashboardSearch {
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: string
  category?: string
  enrollment_status?: string
  batch_id?: string
}

export const Route = createFileRoute(
  "/_authenticated/student-management/enrollment/g1/"
)({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    page: search.page ? Number(search.page) : undefined,
    page_size: search.page_size ? Number(search.page_size) : undefined,
    sort_by: (search.sort_by as string) || undefined,
    sort_order: (search.sort_order as string) || undefined,
    category: (search.category as string) || undefined,
    enrollment_status: (search.enrollment_status as string) || undefined,
    batch_id: (search.batch_id as string) || undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <PipeDashboard />
}
