"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconLoader2,
  IconCheck,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import type { ElectoralDistrict } from "@/lib/api-client/types.gen"
import { GnDivisionSelect } from "./gn-division-select"
import { ELECTORAL_DISTRICTS, ELECTORAL_YEARS } from "./electoral-constants"

export type PollingDivisionEntry = {
  value: string
  label: string
  si: string
  district: string
}

export type ElectoralEntry = {
  id: string
  electoral_year: number
  polling_district: ElectoralDistrict | ""
  polling_division: string
  gn_name: string
  gn_number: string
  polling_area: string
  village_street: string
  voter_names: string[]
  household_head_name: string
}

function VoterNamesField({
  value,
  onChange,
}: {
  value: string[]
  onChange: (names: string[]) => void
}) {
  const [input, setInput] = useState("")
  const addVoter = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInput("")
    }
  }
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        Voter Names (ඡන්ද ගිමියන්ගේ නම්)
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addVoter()
            }
          }}
          placeholder="Type a name and press Enter"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={addVoter}>
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((name) => (
            <Badge key={name} variant="secondary" className="gap-1">
              {name}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== name))}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
              >
                <IconTrash className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

function ElectoralEntryCard({
  entry,
  index,
  onUpdate,
  onRemove,
  canRemove,
  pollingDivisions,
}: {
  entry: ElectoralEntry
  index: number
  onUpdate: (id: string, data: Partial<ElectoralEntry>) => void
  onRemove: (id: string) => void
  canRemove: boolean
  pollingDivisions: PollingDivisionEntry[]
}) {
  const availableDivisions = useMemo(
    () =>
      entry.polling_district
        ? pollingDivisions.filter((d) => d.district === entry.polling_district)
        : [],
    [entry.polling_district, pollingDivisions]
  )

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Year {index + 1}
          </Badge>
          <span className="text-sm font-medium">
            {entry.electoral_year || "New Entry"}
          </span>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(entry.id)}
            className="text-destructive hover:text-destructive"
          >
            <IconTrash className="mr-1 size-4" />
            Remove
          </Button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Year */}
        <div className="col-span-4 space-y-1.5">
          <label className="text-sm font-medium">
            Year (වර්ෂය)
            <span className="ml-0.5 text-destructive">*</span>
          </label>
          <Select
            value={entry.electoral_year?.toString() ?? ""}
            onValueChange={(val) =>
              onUpdate(entry.id, { electoral_year: parseInt(val ?? "0") })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {ELECTORAL_YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Polling District (Electoral District) */}
        <div className="col-span-4 space-y-1.5">
          <label className="text-sm font-medium">
            Polling District (ඡන්ද ප්‍රදේශය)
            <span className="ml-0.5 text-destructive">*</span>
          </label>
          <Select
            value={entry.polling_district}
            onValueChange={(val) =>
              onUpdate(entry.id, {
                polling_district: val as ElectoralDistrict,
                polling_division: "",
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {ELECTORAL_DISTRICTS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label} ({d.si})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Polling Division */}
        <div className="col-span-4 space-y-1.5">
          <label className="text-sm font-medium">
            Polling Division (ඡන්ද කොට්ඨාශය)
            <span className="ml-0.5 text-destructive">*</span>
          </label>
          <Select
            value={entry.polling_division}
            onValueChange={(val) =>
              onUpdate(entry.id, { polling_division: val ?? "" })
            }
            disabled={!entry.polling_district}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  entry.polling_district
                    ? "Select division"
                    : "Select district first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableDivisions.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label} ({d.si})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Polling District No. (numbered subdivision within polling division) */}
        <div className="col-span-4 space-y-1.5">
          <label className="text-sm font-medium">
            Polling District No. (ඡන්ද අංකය)
            <span className="ml-0.5 text-destructive">*</span>
          </label>
          <input
            type="text"
            value={entry.polling_area}
            onChange={(e) =>
              onUpdate(entry.id, { polling_area: e.target.value })
            }
            placeholder="e.g. 42"
            className="flex h-8 w-full rounded-lg border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Village/Street */}
        <div className="col-span-8 space-y-1.5">
          <label className="text-sm font-medium">
            Village/Street (ගම/වීදිය/වත්ත)
            <span className="ml-0.5 text-destructive">*</span>
          </label>
          <input
            type="text"
            value={entry.village_street}
            onChange={(e) =>
              onUpdate(entry.id, { village_street: e.target.value })
            }
            placeholder="e.g. Temple Road"
            className="flex h-8 w-full rounded-lg border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Household Head - full width */}
        <div className="col-span-12 space-y-1.5">
          <label className="text-sm font-medium">
            Household Head (ගෘහ මූලිකගේ නම)
            <span className="ml-0.5 text-destructive">*</span>
          </label>
          <input
            type="text"
            value={entry.household_head_name}
            onChange={(e) =>
              onUpdate(entry.id, { household_head_name: e.target.value })
            }
            placeholder="Name of household head"
            className="flex h-8 w-full rounded-lg border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* GN Division */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          GN Division & No. (ග්‍රාම නිලධාරි වසම හා අංකය)
          <span className="ml-0.5 text-destructive">*</span>
        </label>
        <GnDivisionSelect
          value={entry.gn_name ? `${entry.gn_name}-${entry.gn_number}` : ""}
          onValueChange={(name, number) =>
            onUpdate(entry.id, {
              gn_name: name,
              gn_number: number,
              ...(number && !entry.polling_area
                ? { polling_area: number }
                : {}),
            })
          }
          placeholder="Search GN division..."
        />
        {entry.gn_name && entry.gn_number && (
          <p className="text-xs text-muted-foreground">
            Selected: {entry.gn_name} — No. {entry.gn_number}
          </p>
        )}
      </div>

      <VoterNamesField
        value={entry.voter_names}
        onChange={(names) => onUpdate(entry.id, { voter_names: names })}
      />
    </div>
  )
}

export const MAX_ELECTORAL_ENTRIES = 5

interface Props {
  entries: ElectoralEntry[]
  onChange: (entries: ElectoralEntry[]) => void
  onBack: () => void
  onSave?: (entries: ElectoralEntry[]) => Promise<void>
  onNext: () => void
}

export function WizardStepElectoral({
  entries,
  onChange,
  onBack,
  onSave,
  onNext,
}: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: pollingDivisions = [] } = useQuery({
    queryKey: ["polling-divisions"],
    queryFn: async () => {
      const res = await apiClient.get({ url: "/api/polling-divisions" })
      if (res.error) {
        console.error("Polling divisions error:", res.error)
        return []
      }
      return (res.data ?? []) as PollingDivisionEntry[]
    },
    staleTime: 24 * 60 * 60 * 1000,
  })

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  const addEntry = () => {
    if (entries.length >= MAX_ELECTORAL_ENTRIES) return
    const currentYear = new Date().getFullYear()
    const lastYear =
      entries.length > 0
        ? Math.max(...entries.map((e) => e.electoral_year))
        : currentYear
    onChange([
      ...entries,
      {
        id: crypto.randomUUID(),
        electoral_year: lastYear - 1,
        polling_district: "Galle",
        polling_division: "",
        gn_name: "",
        gn_number: "",
        polling_area: "",
        village_street: "",
        voter_names: [],
        household_head_name: "",
      },
    ])
  }

  const updateEntry = (id: string, data: Partial<ElectoralEntry>) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...data } : e)))
  }

  const removeEntry = (id: string) => {
    onChange(entries.filter((e) => e.id !== id))
  }

  const handleNext = async () => {
    setStatus("saving")
    try {
      if (onSave) await onSave(entries)
      setStatus("done")
      navigateTimer.current = setTimeout(() => onNext(), 400)
    } catch (e) {
      console.error("onSave failed:", e)
      setStatus("idle")
      toastApiError(e, "Failed to save. Please try again.")
    }
  }

  const canAddMore = entries.length < MAX_ELECTORAL_ENTRIES

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Electoral Register</CardTitle>
        <CardDescription>
          Enter the electoral register details for the previous years. Add up to{" "}
          {MAX_ELECTORAL_ENTRIES} years of entries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              No electoral entries yet. Click "Add Year" to begin.
            </p>
            {canAddMore && (
              <Button type="button" variant="outline" onClick={addEntry}>
                <IconPlus className="mr-1.5 size-4" />
                Add Year
              </Button>
            )}
          </div>
        )}

        <div className="space-y-4">
          {entries.map((entry, index) => (
            <ElectoralEntryCard
              key={entry.id}
              entry={entry}
              index={index}
              onUpdate={updateEntry}
              onRemove={removeEntry}
              canRemove={entries.length > 1}
              pollingDivisions={pollingDivisions}
            />
          ))}
        </div>

        {canAddMore && entries.length > 0 && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addEntry}
          >
            <IconPlus className="mr-1.5 size-4" />
            Add Year ({entries.length}/{MAX_ELECTORAL_ENTRIES})
          </Button>
        )}

        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={status !== "idle"}>
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
