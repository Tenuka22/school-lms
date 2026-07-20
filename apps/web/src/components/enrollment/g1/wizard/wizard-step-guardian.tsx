"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiClient } from "@/lib/api-client"
import { listGuardiansOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import type { Guardian } from "@/lib/api-client/types.gen"
import { IconLoader2, IconCheck, IconUser, IconX, IconPhone, IconId, IconBriefcase } from "@tabler/icons-react"
import { getEnumLabel, getEnumStyle } from "@/lib/enum-badge"

export type GuardianFormData = string[]

interface Props {
  selectedIds: string[]
  onDeselect: (id: string) => void
  onSave: (guardianIds: string[]) => Promise<void>
  onBack: () => void
  onNext: () => void
}

type FilterCategory = "staff" | "alumni" | "govt" | "all"

const FILTERS: { key: FilterCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "staff", label: "Staff" },
  { key: "alumni", label: "Alumni" },
  { key: "govt", label: "Govt" },
]

export function WizardStepGuardian({ selectedIds, onDeselect, onSave, onBack, onNext }: Props) {
  const [filter, setFilter] = useState<FilterCategory>("all")
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  const { data: guardians = [] } = useQuery(listGuardiansOptions({ client: apiClient }))
  const guardianMap = useMemo(() => {
    const m = new Map<string, Guardian>()
    for (const g of guardians) m.set(g.id, g)
    return m
  }, [guardians])

  const selectedGuardians = useMemo(() => {
    return selectedIds.map((id) => guardianMap.get(id)).filter(Boolean) as Guardian[]
  }, [selectedIds, guardianMap])

  const filteredGuardians = useMemo(() => {
    if (filter === "all") return selectedGuardians
    return selectedGuardians.filter((g) => {
      if (filter === "staff") return g.is_school_staff
      if (filter === "alumni") return g.is_past_pupil
      return g.is_govt_employee
    })
  }, [selectedGuardians, filter])

  const handleNext = async () => {
    setStatus("saving")
    try {
      await onSave(selectedIds)
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
        <CardTitle>Selected Guardians ({selectedIds.length})</CardTitle>
        <CardDescription>Review and manage guardians assigned to this child.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <Badge
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Badge>
          ))}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-2 gap-3">
            {filteredGuardians.map((g) => (
              <div
                key={g.id}
                className="relative rounded-lg border p-3 space-y-2"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDeselect(g.id)}
                  aria-label={`Remove ${g.full_name}`}
                  className="absolute top-1.5 right-1.5 size-6"
                >
                  <IconX className="size-3.5" />
                </Button>
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <IconUser className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{g.full_name}</p>
                    <p className="text-xs text-muted-foreground">{g.relationship_type}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <IconId className="size-3 shrink-0" />
                    <span>{g.nic_number}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <IconPhone className="size-3 shrink-0" />
                    <span>{g.contact_phone}</span>
                  </p>
                  {g.occupation && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <IconBriefcase className="size-3 shrink-0" />
                      <span className="truncate">{g.occupation}</span>
                    </p>
                  )}
                  {g.workplace_name && (
                    <p className="text-muted-foreground pl-5 truncate">{g.workplace_name}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {g.is_school_staff && (
                    <span className={`inline-flex items-center rounded-sm border px-1 py-0 text-[10px] font-medium ${getEnumStyle("guardian_flag", "staff") ?? ""}`}>
                      Staff
                    </span>
                  )}
                  {g.is_past_pupil && (
                    <span className={`inline-flex items-center rounded-sm border px-1 py-0 text-[10px] font-medium ${getEnumStyle("guardian_flag", "past_pupil") ?? ""}`}>
                      Alumni
                    </span>
                  )}
                  {g.is_govt_employee && (
                    <span className={`inline-flex items-center rounded-sm border px-1 py-0 text-[10px] font-medium ${getEnumStyle("guardian_flag", "govt") ?? ""}`}>
                      Govt
                    </span>
                  )}
                  {g.income_level && (
                    <span className={`inline-flex items-center rounded-sm border px-1 py-0 text-[10px] font-medium ${getEnumStyle("income_level", g.income_level) ?? ""}`}>
                      {getEnumLabel("income_level", g.income_level)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {filteredGuardians.length === 0 && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground text-center py-12">
                  {selectedGuardians.length === 0
                    ? "No guardians selected yet. Browse the directory on the left."
                    : "No guardians match the current filter."}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={handleNext} disabled={status !== "idle" || selectedIds.length === 0}>
            {status === "saving" && <IconLoader2 className="size-4 mr-1.5 animate-spin" />}
            {status === "done" && <IconCheck className="size-4 mr-1.5 text-green-600" />}
            {status === "idle" ? "Next" : status === "saving" ? "Saving\u2026" : "Saved"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
