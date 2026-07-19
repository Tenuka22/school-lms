import { createFileRoute } from "@tanstack/react-router"
import { WizardShell } from "@/components/enrollment/g1/wizard/wizard-shell"

export const Route = createFileRoute(
  "/_authenticated/student-management/enrollment/g1/$enrollment-id",
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <WizardShell />
}
