import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/student-management/")({
  component: StudentManagement,
})

function StudentManagement() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
      <p className="text-muted-foreground text-sm">
        Manage students, enrollments, and academic records
      </p>
    </div>
  )
}
