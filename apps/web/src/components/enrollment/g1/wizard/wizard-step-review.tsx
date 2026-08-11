"use client"

import { useMemo, useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import {
  listStudentsOptions,
  listSchoolsOptions,
} from "@/lib/api-client/@tanstack/react-query.gen"
import type { ChildFormData } from "./wizard-step-child"
import type { AddressEntryValue } from "./wizard-step-address"
import type {
  Address,
  StudentResponse as Student,
  Guardian,
} from "@/lib/api-client/types.gen"
import type { DocumentFormData } from "./wizard-step-documents"
import { getEnumLabel, getEnumStyle } from "@/lib/enum-badge"
import { getInitials } from "@/lib/utils"
import {
  IconFileText,
  IconCheck,
  IconPhone,
  IconCalendar,
  IconHome,
  IconGenderBigender,
  IconGlobe,
  IconBook,
  IconId,
  IconBriefcase,
  IconAlertTriangle,
} from "@tabler/icons-react"

const CATEGORY_OPTIONS = [
  { value: "CloseResident", label: "Close Resident (50%)" },
  { value: "PastPupilChild", label: "Past Pupil / Alumni (25%)" },
  { value: "Sibling", label: "Sibling of Current Student (14%)" },
  { value: "MOEOrUGCStaffChild", label: "MOE / UGC Staff (6%)" },
  { value: "GovernmentTransferOfficerChild", label: "Govt Transfer (4%)" },
  { value: "OverseasArrival", label: "Overseas Arrival (1%)" },
  { value: "ArmedForcesReserved", label: "Armed Forces (Special Quota)" },
  { value: "SpecialNeeds", label: "Special Needs" },
  { value: "LowIncome", label: "Low Income" },
]

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

function Field({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 rounded bg-muted/40 px-2.5 py-1.5">
      {icon && (
        <span className="size-3.5 shrink-0 text-muted-foreground">{icon}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] leading-tight text-muted-foreground">
          {label}
        </p>
        <p className="text-xs font-medium">{value}</p>
      </div>
    </div>
  )
}

interface Props {
  child: ChildFormData
  guardians: Guardian[]
  school: { school_id: string; school_name_si: string }
  selectedAddresses: AddressEntryValue[]
  addresses: Address[]
  siblingIds: string[]
  documents: DocumentFormData[]
  preferredSchoolIds: string[]
  category: string
  overseasArrivalDate: string
  declarationAgreed: boolean
  onCategoryChange?: (category: string) => void
  onDeclarationChange?: (agreed: boolean) => void
  onBack: () => void
  onComplete: (data: {
    category: string
    overseas_arrival_date: string
    declaration_agreed: boolean
  }) => void
}

export function WizardStepReview({
  child,
  guardians,
  school: _school,
  selectedAddresses,
  addresses,
  siblingIds,
  documents,
  preferredSchoolIds,
  category,
  overseasArrivalDate,
  declarationAgreed: declarationAgreedProp,
  onCategoryChange,
  onDeclarationChange,
  onBack,
  onComplete,
}: Props) {
  const addressMap = new Map(addresses.map((a) => [a.id, a]))
  const { data: students = [] } = useQuery(
    listStudentsOptions({ client: apiClient })
  )
  const { data: schools = [] } = useQuery(
    listSchoolsOptions({ client: apiClient })
  )
  const siblingStudents = useMemo(() => {
    const m = new Map<string, Student>(students.map((s) => [s.id, s]))
    return siblingIds.map((id) => m.get(id)).filter(Boolean) as Student[]
  }, [students, siblingIds])
  const uploadedCount = documents.filter((d) => d.status === "uploaded").length
  const selectedSchoolModels = preferredSchoolIds
    .map((id) => schools.find((s) => s.id === id))
    .filter(Boolean)

  const [localCategory, setLocalCategory] = useState<string>(category || "")
  const [localOverseasDate, setLocalOverseasDate] = useState<string>(
    overseasArrivalDate || ""
  )
  const [declarationAgreed, setDeclarationAgreed] = useState(
    declarationAgreedProp
  )
  const isOverseas = localCategory === "OverseasArrival"

  const handleCategoryChange = useCallback(
    (value: string | null) => {
      if (!value) return
      setLocalCategory(value)
      onCategoryChange?.(value)
    },
    [onCategoryChange]
  )

  const handleComplete = useCallback(() => {
    if (!declarationAgreed || !localCategory) return
    onComplete({
      category: localCategory,
      overseas_arrival_date: isOverseas ? localOverseasDate : "",
      declaration_agreed: declarationAgreed,
    })
  }, [
    declarationAgreed,
    localCategory,
    isOverseas,
    localOverseasDate,
    onComplete,
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Review & Lock</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify all information before submitting. Once submitted, this
          application will be locked and cannot be edited without admin
          approval.
        </p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
        <IconAlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Application Lock Notice
          </p>
          <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
            After submission, this application becomes read-only. Only
            administrators can make changes.
          </p>
        </div>
      </div>

      {/* Child */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-12">
            <AvatarFallback className="text-sm font-semibold">
              {child.full_name ? getInitials(child.full_name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">
              {child.full_name || "Not provided"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {child.name_with_initials}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {guardians.length} guardian{guardians.length !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="secondary">
              {uploadedCount} doc{uploadedCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          <Field
            icon={<IconCalendar className="size-3.5" />}
            label="DOB"
            value={child.date_of_birth}
          />
          <Field
            icon={<IconGenderBigender className="size-3.5" />}
            label="Gender"
            value={<ReviewBadge column="gender" value={child.gender} />}
          />
          <Field
            icon={<IconGlobe className="size-3.5" />}
            label="Nationality"
            value={
              <ReviewBadge column="nationality" value={child.nationality} />
            }
          />
          {child.religion && (
            <Field
              icon={<IconBook className="size-3.5" />}
              label="Religion"
              value={<ReviewBadge column="religion" value={child.religion} />}
            />
          )}
          <Field
            icon={<IconBook className="size-3.5" />}
            label="Medium"
            value={
              <ReviewBadge
                column="medium_of_instruction"
                value={child.medium_of_instruction}
              />
            }
          />
          <Field
            icon={<IconId className="size-3.5" />}
            label="Birth Cert"
            value={child.birth_certificate_number || "—"}
          />
        </div>
      </div>

      {/* Two columns: Guardians + Addresses */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Guardians */}
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Guardians</h3>
            <Badge variant="outline" className="text-xs">
              {guardians.length}
            </Badge>
          </div>
          {guardians.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No guardians selected
            </p>
          ) : (
            <div className="space-y-2">
              {guardians.map((g) => (
                <div
                  key={g.id}
                  className="flex items-start gap-2.5 rounded-md bg-muted/30 p-2.5"
                >
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(g.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium">{g.full_name}</p>
                      <ReviewBadge
                        column="relationship_type"
                        value={g.relationship_type}
                      />
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <IconId className="size-2.5" /> {g.nic_number}
                      </span>
                      {g.contact_phone && (
                        <span className="flex items-center gap-0.5">
                          <IconPhone className="size-2.5" /> {g.contact_phone}
                        </span>
                      )}
                      {g.occupation && (
                        <span className="flex items-center gap-0.5">
                          <IconBriefcase className="size-2.5" /> {g.occupation}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {g.is_school_staff && (
                        <Badge
                          variant="outline"
                          className="h-3.5 px-1.5 text-[9px]"
                        >
                          Staff
                        </Badge>
                      )}
                      {g.is_past_pupil && (
                        <Badge
                          variant="outline"
                          className="h-3.5 px-1.5 text-[9px]"
                        >
                          Alumni
                        </Badge>
                      )}
                      {g.is_govt_employee && (
                        <Badge
                          variant="outline"
                          className="h-3.5 px-1.5 text-[9px]"
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
        </div>

        {/* Addresses */}
        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Addresses</h3>
            <Badge variant="outline" className="text-xs">
              {selectedAddresses.length}
            </Badge>
          </div>
          {selectedAddresses.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No addresses selected
            </p>
          ) : (
            <div className="space-y-2">
              {selectedAddresses.map((entry) => {
                const addr = addressMap.get(entry.address_id)
                if (!addr) return null
                return (
                  <div
                    key={entry.address_id}
                    className="rounded-md bg-muted/30 p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <IconHome className="size-3.5 text-muted-foreground" />
                        <p className="text-xs font-medium">
                          {addr.address_line_1}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {entry.is_primary && (
                          <Badge
                            variant="default"
                            className="h-3.5 px-1 text-[9px]"
                          >
                            Primary
                          </Badge>
                        )}
                        <ReviewBadge
                          column="address_type"
                          value={entry.address_type}
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {addr.address_line_2 ||
                        `${addr.district}, ${addr.province}`}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schools */}
      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">School Preferences</h3>
          <Badge variant="outline" className="text-xs">
            {preferredSchoolIds.length} selected
          </Badge>
        </div>
        {preferredSchoolIds.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No school preferences selected
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedSchoolModels.map((school, index) => (
              <div
                key={school!.id}
                className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <p className="text-xs font-medium">{school!.name_si}</p>
                  {school!.name_en && (
                    <p className="text-[10px] text-muted-foreground">
                      {school!.name_en}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Siblings + Documents */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {siblingStudents.length > 0 && (
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">Siblings</h3>
              <Badge variant="outline" className="text-xs">
                {siblingStudents.length}
              </Badge>
            </div>
            <div className="space-y-1.5">
              {siblingStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-2"
                >
                  <Avatar className="size-6 shrink-0">
                    <AvatarFallback className="text-[9px]">
                      {getInitials(s.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {s.full_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Grade {s.current_grade ?? "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Documents</h3>
            <Badge variant="outline" className="text-xs">
              {uploadedCount} uploaded
            </Badge>
          </div>
          {uploadedCount === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No documents uploaded
            </p>
          ) : (
            <div className="space-y-1.5">
              {documents
                .filter((d) => d.status === "uploaded")
                .map((doc) => (
                  <div
                    key={doc.tempId}
                    className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-2"
                  >
                    <IconFileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {doc.doc_type}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {doc.file_name ?? ""}
                      </p>
                    </div>
                    <IconCheck className="size-3.5 shrink-0 text-green-600" />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Category + Declaration */}
      <div className="space-y-4 rounded-lg border p-4">
        <div>
          <p className="mb-1.5 text-sm font-medium">Application Category</p>
          <p className="mb-2 text-xs text-muted-foreground">
            Select the category under which this application is submitted per
            circular 3.0.
          </p>
          <Select value={localCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Overseas date - conditional */}
        {isOverseas && (
          <div className="rounded-md border border-dashed bg-muted/20 p-3">
            <p className="mb-1 text-xs font-medium">Overseas Arrival Date</p>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Per circular 3.6: Children of persons arriving from overseas with
              the child. Provide the date of arrival in Sri Lanka.
            </p>
            <input
              type="date"
              value={localOverseasDate}
              onChange={(e) => setLocalOverseasDate(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        )}

        <Separator />

        <div>
          <label className="flex cursor-pointer items-start gap-2">
            <Checkbox
              checked={declarationAgreed}
              onCheckedChange={(checked) => {
                const val = checked === true
                setDeclarationAgreed(val)
                onDeclarationChange?.(val)
              }}
              className="mt-0.5"
            />
            <span className="text-sm">
              I declare that the information provided is true and accurate. I
              understand that providing false information may result in
              rejection of this application.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div />
          <AlertDialog>
            <AlertDialogTrigger
              disabled={!declarationAgreed || !localCategory}
              render={
                <Button
                  disabled={!declarationAgreed || !localCategory}
                  size="lg"
                >
                  <IconCheck className="size-4" />
                  Complete Enrollment
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete Enrollment</AlertDialogTitle>
                <AlertDialogDescription>
                  After completing, this enrollment will be locked and cannot be
                  edited without admin approval.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleComplete}>
                  Complete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex justify-start border-t pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  )
}
