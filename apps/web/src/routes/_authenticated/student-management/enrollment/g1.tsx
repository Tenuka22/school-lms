import { createFileRoute } from "@tanstack/react-router"
import G1Datagrid from "@/components/enrollment/g1/g1-data-grid"

export const Route = createFileRoute("/_authenticated/student-management/enrollment/g1")({
  component: G1Datagrid,
})
