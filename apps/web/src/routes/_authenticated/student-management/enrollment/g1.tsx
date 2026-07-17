import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/student-management/enrollment/g1")({
  component: G1Enrollment,
})

function G1Enrollment() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">G1 Enrollment</h1>
      <p className="text-muted-foreground text-sm">
        Grade 1 enrollment management
      </p>
    </div>
  )
}
