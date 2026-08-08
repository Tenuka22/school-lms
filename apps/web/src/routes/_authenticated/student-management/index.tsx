import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { IconUsers, IconSchool } from "@tabler/icons-react"

export const Route = createFileRoute("/_authenticated/student-management/")({
  component: StudentManagement,
})

function StudentManagement() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Student Management</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/student-management/students">
          <Card className="transition-colors hover:bg-muted">
            <CardHeader className="flex flex-row items-center gap-4">
              <IconUsers className="size-8" />
              <div>
                <CardTitle>Students</CardTitle>
                <p className="text-sm text-muted-foreground">Enrolled students</p>
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/student-management/children">
          <Card className="transition-colors hover:bg-muted">
            <CardHeader className="flex flex-row items-center gap-4">
              <IconSchool className="size-8" />
              <div>
                <CardTitle>Children</CardTitle>
                <p className="text-sm text-muted-foreground">Registered children</p>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
