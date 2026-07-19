import { createFileRoute } from "@tanstack/react-router"
import { PipeDashboard } from "@/components/enrollment/g1/pipeline/pipeline-dashboard"

export const Route = createFileRoute("/_authenticated/student-management/enrollment/g1/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <PipeDashboard />
}

export interface G1SearchParams {
  page?: string | number
  page_size?: string | number
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
