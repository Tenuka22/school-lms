"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiClient } from "@/lib/api-client"
import { listStudentsOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import type { Student } from "@/lib/api-client/types.gen"
import {
  IconLoader2,
  IconCheck,
  IconSchool,
  IconX,
  IconGripVertical,
} from "@tabler/icons-react"

interface Props {
  selectedStudentIds: string[]
  onDeselect: (id: string) => void
  onSave: (studentIds: string[]) => Promise<void>
  onBack: () => void
  onNext: () => void
}

export function WizardStepSiblings({
  selectedStudentIds,
  onDeselect,
  onSave,
  onBack,
  onNext,
}: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  const { data: students = [] } = useQuery(
    listStudentsOptions({ client: apiClient })
  )
  const studentMap = useMemo(() => {
    const m = new Map<string, Student>()
    for (const s of students) m.set(s.id, s)
    return m
  }, [students])

  const selectedStudents = useMemo(() => {
    return selectedStudentIds
      .map((id) => studentMap.get(id))
      .filter(Boolean) as Student[]
  }, [selectedStudentIds, studentMap])

  const handleNext = async () => {
    setStatus("saving")
    try {
      await onSave(selectedStudentIds)
      setStatus("done")
      navigateTimer.current = setTimeout(() => onNext(), 400)
    } catch (e) {
      console.error("onSave failed:", e)
      setStatus("idle")
      toast.error("Failed to save. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Siblings ({selectedStudentIds.length})</CardTitle>
        <CardDescription>
          Review siblings currently enrolled at this school.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-2 gap-3">
            {selectedStudents.map((s) => (
              <div
                key={s.id}
                className="relative space-y-2 rounded-lg border p-3"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDeselect(s.id)}
                  aria-label={`Remove ${s.full_name}`}
                  className="absolute top-1.5 right-1.5 size-6"
                >
                  <IconX className="size-3.5" />
                </Button>
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <IconSchool className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {s.full_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.name_with_initials}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <IconGripVertical className="size-3 shrink-0" />
                    <span>Enrollment Grade: {s.current_grade ?? "N/A"}</span>
                  </p>
                  {s.admission_number && (
                    <p className="pl-5 text-muted-foreground">
                      {s.admission_number}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {s.medium_of_instruction}
                  </Badge>
                </div>
              </div>
            ))}
            {selectedStudents.length === 0 && (
              <div className="col-span-2">
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No siblings selected yet. Browse the directory on the left.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={status !== "idle"}
          >
            {status === "saving" && (
              <IconLoader2 className="mr-1.5 size-4 animate-spin" />
            )}
            {status === "done" && (
              <IconCheck className="mr-1.5 size-4 text-green-600" />
            )}
            {status === "idle"
              ? "Next"
              : status === "saving"
                ? "Saving\u2026"
                : "Saved"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
