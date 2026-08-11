import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { IconUsers, IconSchool } from "@tabler/icons-react"

export const Route = createFileRoute("/_authenticated/guardian-management/")({
  component: GuardianManagement,
})

function GuardianManagement() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Guardian Management</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/guardian-management/guardians">
          <Card className="transition-colors hover:bg-muted">
            <CardHeader className="flex flex-row items-center gap-4">
              <IconUsers className="size-8" />
              <div>
                <CardTitle>Guardians</CardTitle>
                <p className="text-sm text-muted-foreground">
                  All guardians and their linked children
                </p>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/guardian-management/guardians" search={{ is_past_pupil: "true" }}>
          <Card className="transition-colors hover:bg-muted">
            <CardHeader className="flex flex-row items-center gap-4">
              <IconSchool className="size-8" />
              <div>
                <CardTitle>Alumni Guardians</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Guardians who are past pupils
                </p>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
