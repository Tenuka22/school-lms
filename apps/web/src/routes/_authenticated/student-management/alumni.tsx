import { createFileRoute } from "@tanstack/react-router"
import { AlumniDataGrid } from "@/components/student/alumni-data-grid"
import { queryClient } from "@/router"
import { listStudentsOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import { apiClient } from "@/lib/api-client"

export const Route = createFileRoute(
  "/_authenticated/student-management/alumni"
)({
  loader: async () => {
    await queryClient.ensureQueryData(
      listStudentsOptions({ client: apiClient })
    )
  },
  component: AlumniPage,
})

function AlumniPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alumni</h1>
        <p className="text-sm text-muted-foreground">
          Students who have graduated or left the school
        </p>
      </div>

      <AlumniDataGrid />
    </div>
  )
}
