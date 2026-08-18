import { createFileRoute } from "@tanstack/react-router"
import { GuardiansDataGrid } from "@/components/guardian/guardians-data-grid"
import { queryClient } from "@/router"
import { listGuardiansOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import { apiClient } from "@/lib/api-client"

export const Route = createFileRoute(
  "/_authenticated/guardian-management/guardians"
)({
  loader: async () => {
    await queryClient.ensureQueryData(
      listGuardiansOptions({ client: apiClient })
    )
  },
  component: GuardiansPage,
})

function GuardiansPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Guardians</h1>
        <p className="text-sm text-muted-foreground">
          All guardians and their linked children
        </p>
      </div>

      <GuardiansDataGrid />
    </div>
  )
}
