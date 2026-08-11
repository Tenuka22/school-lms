"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChildFormData } from "../wizard/wizard-step-child"
import type {
  Address,
  Guardian,
  StudentResponse as Student,
  G1Application,
} from "@/lib/api-client/types.gen"
import { getEnumLabel, getEnumStyle } from "@/lib/enum-badge"
import { getInitials } from "@/lib/utils"
import {
  IconUser,
  IconHome,
  IconSchool,
  IconClipboardCheck,
  IconMapPin,
} from "@tabler/icons-react"

const CATEGORY_LABELS: Record<string, string> = {
  CloseResident: "Close Resident (50%)",
  PastPupilChild: "Past Pupil / Alumni (25%)",
  Sibling: "Sibling of Current Student (14%)",
  MOEOrUGCStaffChild: "MOE / UGC Staff Child (6%)",
  GovernmentTransferOfficerChild: "Govt Transfer Officer Child (4%)",
  OverseasArrival: "Overseas Arrival (1%)",
  ArmedForcesReserved: "Armed Forces Reserved",
  SpecialNeeds: "Special Needs",
  LowIncome: "Low Income",
}

function ReviewBadge({
  column,
  value,
}: {
  column: string
  value: string | null | undefined
}) {
  if (!value) return null
  const label = getEnumLabel(column, value)
  const style = getEnumStyle(column, value)
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${style ?? "border-border bg-muted text-muted-foreground"}`}
    >
      {label}
    </span>
  )
}

interface Props {
  child: ChildFormData
  application: G1Application
  guardians: Guardian[]
  addresses: Array<{
    address_id: string
    address_type: string
    residence_type: string
    is_primary: boolean
  }>
  allAddresses: Address[]
  siblings: Student[]
  schools: Array<{
    id: string
    name_si?: string | null
    name_en?: string | null
  }>
  documents: Array<{ doc_type: string }>
  onNext: () => void
}

export function InterviewStepOverview({
  child,
  application,
  guardians,
  addresses,
  allAddresses,
  siblings,
  schools,
  onNext,
}: Props) {
  const addressMap = useMemo(
    () => new Map(allAddresses.map((a) => [a.id, a])),
    [allAddresses]
  )
  const primaryAddress = useMemo(() => {
    const entry = addresses.find((e) => e.is_primary) ?? addresses[0]
    if (!entry) return null
    return addressMap.get(entry.address_id) ?? null
  }, [addresses, addressMap])

  const preferredSchools = useMemo(() => {
    const ids = Array.isArray(application.preferred_school_ids)
      ? (application.preferred_school_ids as string[])
      : []
    return ids
      .map((id) => schools.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s)
  }, [application.preferred_school_ids, schools])

  const categoryLabel =
    CATEGORY_LABELS[application.category ?? ""] ?? "Not categorized"

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Interview Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Brief summary of the enrollment application. Review before scoring.
        </p>
      </div>

      {/* Interview Panel Note */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
        <IconClipboardCheck className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Interview Panel
            <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
              සම්මුඛ පරීක්ෂණ මණ්ඩලය
            </span>
          </p>
          <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-300">
            Principal (Chair), Senior Teacher, Deputy/Asst Principal
            (Secretary), SDC Representative, Old Students&apos; Association
            Representative.
            <br />
            <span className="text-[11px] text-blue-600 dark:text-blue-400">
              විදුහල්පති (සභාපති), ජ්‍යේෂ්ඨ ගුරුවරයා, නියෝජ්‍ය/සහකාර විදුහල්පති
              (ලේකම්), පාසල් සංවර්ධන සමිති නියෝජිත, ආදි ශිෂ්‍ය සංගම් නියෝජිත
            </span>
          </p>
        </div>
      </div>

      {/* Child + Category */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <IconUser className="size-4" />
              Applicant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="text-xs font-semibold">
                  {child.full_name ? getInitials(child.full_name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="font-semibold">
                  {child.full_name || "Not provided"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {child.name_with_initials}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>DOB: {child.date_of_birth}</span>
                  <span>{child.gender}</span>
                  <span>{child.nationality}</span>
                  {child.religion && <span>{child.religion}</span>}
                  <span>Medium: {child.medium_of_instruction}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-xs">
              {categoryLabel}
            </Badge>
            {application.list_category && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">List: </span>
                <ReviewBadge
                  column="list_category"
                  value={application.list_category}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Guardian */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <IconUser className="size-4" />
            Guardian
          </CardTitle>
        </CardHeader>
        <CardContent>
          {guardians.length === 0 ? (
            <p className="text-xs text-muted-foreground">No guardians</p>
          ) : (
            <div className="space-y-2">
              {guardians.map((g) => (
                <div key={g.id} className="flex items-center gap-3">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-[9px]">
                      {getInitials(g.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">{g.full_name}</span>
                      <ReviewBadge
                        column="relationship_type"
                        value={g.relationship_type}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                      <span>NIC: {g.nic_number}</span>
                      {g.contact_phone && <span>Tel: {g.contact_phone}</span>}
                      {g.occupation && <span>{g.occupation}</span>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {g.is_school_staff && (
                        <Badge
                          variant="outline"
                          className="h-3 px-1 text-[8px]"
                        >
                          Staff
                        </Badge>
                      )}
                      {g.is_past_pupil && (
                        <Badge
                          variant="outline"
                          className="h-3 px-1 text-[8px]"
                        >
                          Alumni
                        </Badge>
                      )}
                      {g.is_govt_employee && (
                        <Badge
                          variant="outline"
                          className="h-3 px-1 text-[8px]"
                        >
                          Govt
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address + Schools */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <IconHome className="size-4" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {primaryAddress ? (
              <div>
                <p className="text-xs font-medium">
                  {primaryAddress.address_line_1}
                </p>
                {primaryAddress.address_line_2 && (
                  <p className="text-[11px] text-muted-foreground">
                    {primaryAddress.address_line_2}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {primaryAddress.city}, {primaryAddress.district},{" "}
                  {primaryAddress.province}
                </p>
                {primaryAddress.distance_to_school_km && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <IconMapPin className="size-2.5" />
                    {primaryAddress.distance_to_school_km} km to school
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No address</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <IconSchool className="size-4" />
              Preferred Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            {preferredSchools.length === 0 ? (
              <p className="text-xs text-muted-foreground">None selected</p>
            ) : (
              <div className="space-y-1">
                {preferredSchools.map((school, i) => (
                  <div key={school.id} className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="text-xs">{school.name_si}</span>
                    {school.name_en && (
                      <span className="text-[10px] text-muted-foreground">
                        ({school.name_en})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Siblings */}
      {siblings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Siblings at School</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2 py-1"
                >
                  <span className="text-xs font-medium">{s.full_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    Gr.{s.current_grade ?? "?"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end border-t pt-4">
        <Button onClick={onNext}>Start Scoring</Button>
      </div>
    </div>
  )
}
