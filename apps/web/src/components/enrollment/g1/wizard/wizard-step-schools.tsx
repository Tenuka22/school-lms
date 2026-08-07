"use client"

import { useState, useCallback } from "react"
import { toastApiError } from "@/lib/api-error"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { listSchoolsOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { IconLoader2, IconCheck, IconSearch, IconX, IconArrowUp, IconArrowDown } from "@tabler/icons-react"
import { FormBuilder, schemaToFormFields } from "@/lib/form-builder"
import type { FormConfig } from "@/lib/form-builder"
import * as v from "valibot"

export type SchoolPreferencesFormData = {
  closer_school_exists: boolean
}

interface Props {
  preferredSchoolIds: string[]
  closerSchoolExists: boolean
  onChangePreferredSchools: (ids: string[]) => void
  onChangeCloserSchool: (value: boolean) => void
  onSave: () => Promise<void>
  onBack: () => void
  onNext: () => void
}

const SchoolPreferencesSchema = v.object({
  closer_school_exists: v.boolean(),
})

export function WizardStepSchools({
  preferredSchoolIds,
  closerSchoolExists,
  onChangePreferredSchools,
  onChangeCloserSchool,
  onSave,
  onBack,
  onNext,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")

  const { data: allSchools = [] } = useQuery(
    listSchoolsOptions({
      client: apiClient,
    })
  )

  const schools = searchQuery
    ? allSchools.filter((s) =>
        s.name_si.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allSchools

  const selectedSchools = preferredSchoolIds
    .map((id) => allSchools.find((s) => s.id === id))
    .filter(Boolean) as typeof allSchools

  const availableSchools = schools.filter(
    (s) => !preferredSchoolIds.includes(s.id)
  )

  const handleAddSchool = useCallback((schoolId: string) => {
    onChangePreferredSchools([...preferredSchoolIds, schoolId])
  }, [preferredSchoolIds, onChangePreferredSchools])

  const handleRemoveSchool = useCallback((schoolId: string) => {
    onChangePreferredSchools(preferredSchoolIds.filter((id) => id !== schoolId))
  }, [preferredSchoolIds, onChangePreferredSchools])

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return
    const newIds = [...preferredSchoolIds]
    ;[newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]]
    onChangePreferredSchools(newIds)
  }, [preferredSchoolIds, onChangePreferredSchools])

  const handleMoveDown = useCallback((index: number) => {
    if (index === preferredSchoolIds.length - 1) return
    const newIds = [...preferredSchoolIds]
    ;[newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]]
    onChangePreferredSchools(newIds)
  }, [preferredSchoolIds, onChangePreferredSchools])

  const fields = schemaToFormFields<SchoolPreferencesFormData>({
    schema: SchoolPreferencesSchema as any,
    include: ["closer_school_exists"],
    overrides: {
      closer_school_exists: { label: "Is there a school closer to your residence?" },
    },
  })

  const config: FormConfig<SchoolPreferencesFormData> = {
    fields,
    layout: [
      { columns: [{ fields: ["closer_school_exists"] }] },
    ],
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 5: School Preferences</CardTitle>
        <CardDescription>
          Select schools in order of priority. You may select up to 6 schools.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected Schools List */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preferred Schools (Priority Order)</Label>
          {selectedSchools.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No schools selected. Search and add schools below.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedSchools.map((school, index) => (
                <div
                  key={school!.id}
                  className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2"
                >
                  <Badge variant="secondary" className="size-6 shrink-0 justify-center rounded-full text-xs">
                    {index + 1}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{school!.name_si}</p>
                    {school!.name_en && (
                      <p className="truncate text-xs text-muted-foreground">{school!.name_en}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <IconArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === selectedSchools.length - 1}
                    >
                      <IconArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => handleRemoveSchool(school!.id)}
                    >
                      <IconX className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search and Add */}
        <div className="space-y-2">
          <Label htmlFor="school-search" className="text-sm font-medium">Search Schools</Label>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="school-search"
              placeholder="Search by school name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="pl-9"
            />
          </div>
          {isSearchFocused && (
            <div className="max-h-48 overflow-y-auto rounded-md border">
              {availableSchools.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">No matching schools found.</p>
              ) : (
                availableSchools.slice(0, 10).map((school) => (
                  <button
                    key={school.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleAddSchool(school.id)
                      setSearchQuery("")
                    }}
                    className="flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                  >
                    <Badge variant="outline" className="size-5 shrink-0 justify-center text-xs">
                      +
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{school.name_si}</p>
                      {school.name_en && (
                        <p className="truncate text-xs text-muted-foreground">{school.name_en}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Closer School Question */}
        <div className="rounded-md border p-4">
          <FormBuilder<SchoolPreferencesFormData>
            config={config}
            defaultValues={{ closer_school_exists: closerSchoolExists }}
            onSubmit={async (values) => {
              onChangeCloserSchool(values.closer_school_exists)
            }}
            formId="school-prefs-form"
            hideDefaultButtons
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                setStatus("saving")
                try {
                  await onSave()
                  setStatus("done")
                  setTimeout(() => setStatus("idle"), 1500)
                } catch (e) {
                  toastApiError(e, "Failed to save")
                  setStatus("idle")
                }
              }}
              disabled={status === "saving"}
            >
              {status === "saving" && <IconLoader2 className="mr-1.5 size-4 animate-spin" />}
              {status === "done" && <IconCheck className="mr-1.5 size-4 text-green-600" />}
              {status === "idle" ? "Save Progress" : status === "saving" ? "Saving\u2026" : "Saved"}
            </Button>
          </div>
          <Button onClick={async () => {
            try {
              await onSave()
              onNext()
            } catch (e) {
              toastApiError(e, "Failed to save")
            }
          }}>
            Next Step
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
