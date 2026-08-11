import { createFileRoute } from "@tanstack/react-router"
import { StudentsDataGrid } from "@/components/student/students-data-grid"
import { CreateStudentDialog } from "@/components/student/create-student-dialog"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { useState } from "react"

export const Route = createFileRoute(
  "/_authenticated/student-management/students"
)({
  component: StudentsPage,
})

function StudentsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            Students enrolled in the school
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <IconPlus className="mr-1.5 size-4" />
          Add Student
        </Button>
      </div>

      <StudentsDataGrid key={refreshKey} />

      <CreateStudentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
