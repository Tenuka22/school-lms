"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { toastApiError } from "@/lib/api-error"
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
import { listGuardiansOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import type { Guardian } from "@/lib/api-client/types.gen"
import {
  IconLoader2,
  IconCheck,
  IconUser,
  IconX,
  IconPhone,
  IconId,
  IconBriefcase,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react"
import { getEnumLabel, getEnumStyle } from "@/lib/enum-badge"

export type ElectoralData = {
  electoral_year: number
  polling_district: string
  gn_division: string
  polling_area: string
  voter_names: string[]
  household_head_name: string
}

export type GuardianFormData = string[]

interface Props {
  selectedIds: string[]
  electoralData: ElectoralData
  onDeselect: (id: string) => void
  onSave: (guardianIds: string[], electoralData: ElectoralData) => Promise<void>
  onBack: () => void
  onNext: () => void
  onElectoralChange: (data: ElectoralData) => void
}

type FilterCategory = "staff" | "alumni" | "govt" | "all"

const FILTERS: { key: FilterCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "staff", label: "Staff" },
  { key: "alumni", label: "Alumni" },
  { key: "govt", label: "Govt" },
]

export function WizardStepGuardian({
  selectedIds,
  electoralData,
  onDeselect,
  onSave,
  onBack,
  onNext,
  onElectoralChange,
}: Props) {
  const [filter, setFilter] = useState<FilterCategory>("all")
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")
  const [electoralOpen, setElectoralOpen] = useState(false)
  const [voterInput, setVoterInput] = useState("")
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  const { data: guardians = [] } = useQuery(
    listGuardiansOptions({ client: apiClient })
  )
  const guardianMap = useMemo(() => {
    const m = new Map<string, Guardian>()
    for (const g of guardians) m.set(g.id, g)
    return m
  }, [guardians])

  const selectedGuardians = useMemo(() => {
    return selectedIds
      .map((id) => guardianMap.get(id))
      .filter(Boolean) as Guardian[]
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
      await onSave(selectedIds, electoralData)
      setStatus("done")
      navigateTimer.current = setTimeout(() => onNext(), 400)
    } catch (e) {
      console.error("onSave failed:", e)
      setStatus("idle")
      toastApiError(e, "Failed to save. Please try again.")
    }
  }

  const addVoter = () => {
    const trimmed = voterInput.trim()
    if (trimmed && !electoralData.voter_names.includes(trimmed)) {
      onElectoralChange({
        ...electoralData,
        voter_names: [...electoralData.voter_names, trimmed],
      })
      setVoterInput("")
    }
  }

  const removeVoter = (name: string) => {
    onElectoralChange({
      ...electoralData,
      voter_names: electoralData.voter_names.filter((v) => v !== name),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Guardians ({selectedIds.length})</CardTitle>
        <CardDescription>
          Review and manage guardians assigned to this child.
        </CardDescription>
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
                className="relative space-y-2 rounded-lg border p-3"
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
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <IconUser className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {g.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {g.relationship_type}
                    </p>
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
                    <p className="truncate pl-5 text-muted-foreground">
                      {g.workplace_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {g.is_school_staff && (
                    <span
                      className={`inline-flex items-center rounded-sm border px-1 py-0 text-[10px] font-medium ${getEnumStyle("guardian_flag", "staff") ?? ""}`}
                    >
                      Staff
                    </span>
                  )}
                  {g.is_past_pupil && (
                    <span
                      className={`inline-flex items-center rounded-sm border px-1 py-0 text-[10px] font-medium ${getEnumStyle("guardian_flag", "past_pupil") ?? ""}`}
                    >
                      Alumni
                    </span>
                  )}
                  {g.is_govt_employee && (
                    <span
                      className={`inline-flex items-center rounded-sm border px-1 py-0 text-[10px] font-medium ${getEnumStyle("guardian_flag", "govt") ?? ""}`}
                    >
                      Govt
                    </span>
                  )}
                  {g.income_level && (
                    <span
                      className={`inline-flex items-center rounded-sm border px-1 py-0 text-[10px] font-medium ${getEnumStyle("income_level", g.income_level) ?? ""}`}
                    >
                      {getEnumLabel("income_level", g.income_level)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {filteredGuardians.length === 0 && (
              <div className="col-span-2">
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {selectedGuardians.length === 0
                    ? "No guardians selected yet. Browse the directory on the left."
                    : "No guardians match the current filter."}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="rounded-lg border">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
            onClick={() => setElectoralOpen(!electoralOpen)}
          >
            Electoral Register
            {electoralOpen ? (
              <IconChevronUp className="size-4" />
            ) : (
              <IconChevronDown className="size-4" />
            )}
          </button>
          {electoralOpen && (
            <div className="space-y-4 border-t px-4 pb-4 pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Electoral Year</label>
                  <input
                    type="number"
                    value={electoralData.electoral_year || ""}
                    onChange={(e) =>
                      onElectoralChange({
                        ...electoralData,
                        electoral_year: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="2024"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Polling District</label>
                  <input
                    type="text"
                    value={electoralData.polling_district}
                    onChange={(e) =>
                      onElectoralChange({
                        ...electoralData,
                        polling_district: e.target.value,
                      })
                    }
                    placeholder="e.g. District 01"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">GN Division</label>
                  <input
                    type="text"
                    value={electoralData.gn_division}
                    onChange={(e) =>
                      onElectoralChange({
                        ...electoralData,
                        gn_division: e.target.value,
                      })
                    }
                    placeholder="e.g. GN 123"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Polling Area</label>
                  <input
                    type="text"
                    value={electoralData.polling_area}
                    onChange={(e) =>
                      onElectoralChange({
                        ...electoralData,
                        polling_area: e.target.value,
                      })
                    }
                    placeholder="e.g. Area A"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Household Head Name</label>
                  <input
                    type="text"
                    value={electoralData.household_head_name}
                    onChange={(e) =>
                      onElectoralChange({
                        ...electoralData,
                        household_head_name: e.target.value,
                      })
                    }
                    placeholder="Name of household head"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Voter Names</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voterInput}
                    onChange={(e) => setVoterInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addVoter()
                      }
                    }}
                    placeholder="Type a name and press Enter"
                    className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  />
                  <Button type="button" variant="outline" onClick={addVoter}>
                    Add
                  </Button>
                </div>
                {electoralData.voter_names.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {electoralData.voter_names.map((name) => (
                      <Badge key={name} variant="secondary" className="gap-1">
                        {name}
                        <button
                          type="button"
                          onClick={() => removeVoter(name)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                        >
                          <IconX className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={status !== "idle" || selectedIds.length === 0}
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
