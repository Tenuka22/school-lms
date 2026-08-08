import { createFileRoute } from "@tanstack/react-router"
import { ChildrenDataGrid } from "@/components/student/children-data-grid"

export const Route = createFileRoute("/_authenticated/student-management/")({
  component: StudentManagement,
})

function StudentManagement() {
  return <ChildrenDataGrid />
}
