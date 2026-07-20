import { createFileRoute } from "@tanstack/react-router"
import { PipeDashboard } from "@/components/enrollment/g1/pipeline/pipeline-dashboard"

export const Route = createFileRoute("/_authenticated/student-management/enrollment/g1/")({
  validateSearch: (search: Record<string, unknown>) => search,
  component: RouteComponent,
})

function RouteComponent() {
  return <PipeDashboard />
}
