import { createFileRoute } from "@tanstack/react-router"
import { PipeDashboard } from "@/components/enrollment/g1/pipeline/pipeline-dashboard"

export interface DashboardSearch {
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: string
  full_name?: string
  name_with_initials?: string
  gender?: string
  nationality?: string
  category?: string
  medium_of_instruction?: string
  enrollment_status?: string
}

export const Route = createFileRoute(
  "/_authenticated/student-management/enrollment/g1/"
)({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => ({
    page: search.page ? Number(search.page) : undefined,
    page_size: search.page_size ? Number(search.page_size) : undefined,
    sort_by: (search.sort_by as string) || undefined,
    sort_order: (search.sort_order as string) || undefined,
    full_name: (search.full_name as string) || undefined,
    name_with_initials: (search.name_with_initials as string) || undefined,
    gender: (search.gender as string) || undefined,
    nationality: (search.nationality as string) || undefined,
    category: (search.category as string) || undefined,
    medium_of_instruction:
      (search.medium_of_instruction as string) || undefined,
    enrollment_status: (search.enrollment_status as string) || undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  return <PipeDashboard />
}
