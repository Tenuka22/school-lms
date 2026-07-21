import { createFileRoute } from "@tanstack/react-router"
import { ScoringDashboard } from "@/components/enrollment/g1/scoring/scoring-dashboard"

export const Route = createFileRoute(
  "/_authenticated/student-management/enrollment/g1/scoring/$enrollment_id",
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { enrollment_id } = Route.useParams()
  return <ScoringDashboard enrollmentId={enrollment_id} />
}
