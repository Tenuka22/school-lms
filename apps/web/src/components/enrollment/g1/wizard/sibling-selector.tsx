"use client"

import { useState, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiClient } from "@/lib/api-client"
import { listStudentsOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import { cn } from "@/lib/utils"
import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconCheck,
  IconGripVertical,
  IconPencil,
} from "@tabler/icons-react"
import type { Student } from "@/lib/api-client/types.gen"
import { useDebounce } from "@/hooks/use-debounce"
import { CreateSiblingDialog } from "./sibling-form"
import { EditStudentDialog } from "./edit-student-dialog"

const PAGE_SIZE = 8

interface SiblingSelectorProps {
  enrollmentId: string
  schoolId: string
  selectedStudentIds: string[]
  onSelect: (id: string) => void
  onDeselect: (id: string) => void
}

export function SiblingSelector({
  enrollmentId,
  schoolId,
  selectedStudentIds,
  onSelect,
  onDeselect,
}: SiblingSelectorProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const debouncedSearch = useDebounce(search, 300)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  const { data: students = [] } = useQuery(
    listStudentsOptions({
      client: apiClient,
      ...(debouncedSearch ? { query: { search: debouncedSearch } } : {}),
    })
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.admission_number ?? "").toLowerCase().includes(q) ||
        s.name_with_initials.toLowerCase().includes(q)
    )
  }, [students, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const handlePageChange = (p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)))
  }

  const handleCreated = useCallback(
    (studentId: string) => {
      onSelect(studentId)
      setPage(0)
    },
    [onSelect]
  )

  return (
    <div className="space-y-3">
      <div className="relative">
        <IconSearch className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, admission no..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className="pl-9"
        />
      </div>

      <CreateSiblingDialog
        enrollmentId={enrollmentId}
        schoolId={schoolId}
        onCreated={handleCreated}
      />

      <p className="text-xs text-muted-foreground">
        Select students currently enrolled at this school as siblings.
      </p>

      <ScrollArea className="h-[360px] pr-2">
        <div className="space-y-1">
          {paged.map((s) => {
            const isSelected = selectedStudentIds.includes(s.id)
            const displayGrade = s.current_grade ?? "N/A"
            return (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => (isSelected ? onDeselect(s.id) : onSelect(s.id))}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    isSelected ? onDeselect(s.id) : onSelect(s.id)
                }}
                className={cn(
                  "group flex w-full cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent",
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{s.full_name}</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingStudent(s)
                      }}
                      aria-label={`Edit ${s.full_name}`}
                      className="-mr-1 size-6 shrink-0"
                    >
                      <IconPencil className="size-3" />
                    </Button>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.name_with_initials}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <IconGripVertical className="size-3 shrink-0" />
                    <span>Enrollment Grade: {displayGrade}</span>
                    {s.admission_number && (
                      <>
                        <span className="text-muted-foreground/40">
                          &middot;
                        </span>
                        <span>{s.admission_number}</span>
                      </>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary">
                    <IconCheck className="size-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            )
          })}
          {paged.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search ? "No students found" : "No students available."}
            </p>
          )}
        </div>
      </ScrollArea>

      {editingStudent && (
        <EditStudentDialog
          student={editingStudent}
          open={true}
          onOpenChange={(o) => {
            if (!o) setEditingStudent(null)
          }}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage === 0}
            onClick={() => handlePageChange(safePage - 1)}
          >
            <IconChevronLeft className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {safePage + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage >= totalPages - 1}
            onClick={() => handlePageChange(safePage + 1)}
          >
            <IconChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
