import { createFileRoute } from "@tanstack/react-router"
import { GuardiansDataGrid } from "@/components/guardian/guardians-data-grid"

export const Route = createFileRoute("/_authenticated/guardian-management/guardians")({
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
