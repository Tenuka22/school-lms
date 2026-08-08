import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { ChildrenDataGrid } from "@/components/student/children-data-grid"
import { CreateChildDialog } from "@/components/student/create-child-dialog"
import { EditChildDialog } from "@/components/student/edit-child-dialog"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import type { Child } from "@/lib/api-client/types.gen"

export const Route = createFileRoute("/_authenticated/student-management/children")({
  component: ChildrenPage,
})

function ChildrenPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editChild, setEditChild] = useState<Child | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Children</h1>
          <p className="text-sm text-muted-foreground">
            Children registered but not yet enrolled as students
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <IconPlus className="mr-1.5 size-4" />
          Add Child
        </Button>
      </div>

      <ChildrenDataGrid
        key={refreshKey}
        hasStudent={false}
        onEdit={(child) => setEditChild(child)}
      />

      <CreateChildDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      <EditChildDialog
        child={editChild}
        onOpenChange={(open) => {
          if (!open) setEditChild(null)
        }}
        onSuccess={() => {
          setRefreshKey((k) => k + 1)
          setEditChild(null)
        }}
      />
    </div>
  )
}
