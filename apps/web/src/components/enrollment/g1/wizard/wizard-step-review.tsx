"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { listStudentsOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import type { ChildFormData } from "./wizard-step-child"
import type { SchoolFormData } from "./wizard-step-school"
import type { AddressEntryValue } from "./wizard-step-address"
import type { WorkspaceAddress, Student } from "@/lib/api-client/types.gen"
import type { DocumentFormData } from "./wizard-step-documents"
import type { Guardian } from "@/lib/api-client/types.gen"
import { getEnumLabel, getEnumStyle } from "@/lib/enum-badge"
import { IconSchool, IconFileText, IconCheck, IconMapPin, IconUsers, IconPhone, IconCalendar, IconFlag, IconHome, IconGenderBigender, IconGlobe, IconBook, IconId, IconCategory, IconMail, IconBriefcase, IconBuilding, IconCoin } from "@tabler/icons-react"

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function ReviewBadge({ column, value }: { column: string; value: string | null | undefined }) {
  if (!value) return null
  const label = getEnumLabel(column, value)
  const style = getEnumStyle(column, value)
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${style ?? "bg-muted text-muted-foreground border-border"}`}>{label}</span>
}

function Field({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
      {icon && <span className="size-4 shrink-0 text-muted-foreground">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
        <p className="text-sm font-medium leading-tight">{value}</p>
      </div>
    </div>
  )
}

interface Props {
  child: ChildFormData
  guardians: Guardian[]
  school: SchoolFormData
  selectedAddresses: AddressEntryValue[]
  workspaceAddresses: WorkspaceAddress[]
  siblingIds: string[]
  documents: DocumentFormData[]
  onBack: () => void
  onComplete: () => void
}

export function WizardStepReview({
  child,
  guardians,
  school: _school,
  selectedAddresses,
  workspaceAddresses,
  siblingIds,
  documents,
  onBack,
  onComplete,
}: Props) {
  const addressMap = new Map(workspaceAddresses.map((a) => [a.id, a]))
  const { data: students = [] } = useQuery(listStudentsOptions({ client: apiClient }))
  const siblingStudents = useMemo(() => {
    const m = new Map<string, Student>(students.map((s) => [s.id, s]))
    return siblingIds.map((id) => m.get(id)).filter(Boolean) as Student[]
  }, [students, siblingIds])

  const uploadedCount = documents.filter((d) => d.status === "uploaded").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Review & Lock</h2>
          <p className="text-sm text-muted-foreground">Verify all information before submitting.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <IconCheck className="size-3.5 text-green-600" />
            {uploadedCount} document{uploadedCount !== 1 ? "s" : ""} uploaded
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <IconUsers className="size-3.5" />
            {guardians.length} guardian{guardians.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="px-4">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-14 ring-2 ring-background">
              <AvatarFallback className="text-lg font-semibold">
                {child.full_name ? getInitials(child.full_name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{child.full_name || "Child Profile"}</h3>
              <p className="text-sm text-muted-foreground">{child.name_with_initials}</p>
            </div>
          </div>
        </div>
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <Field icon={<IconCalendar className="size-4" />} label="Date of Birth" value={child.date_of_birth} />
            <Field icon={<IconGenderBigender className="size-4" />} label="Gender" value={<ReviewBadge column="gender" value={child.gender} />} />
            <Field icon={<IconGlobe className="size-4" />} label="Nationality" value={<ReviewBadge column="nationality" value={child.nationality} />} />
            {child.religion && (
              <Field icon={<IconBook className="size-4" />} label="Religion" value={<ReviewBadge column="religion" value={child.religion} />} />
            )}
            <Field icon={<IconBook className="size-4" />} label="Medium" value={<ReviewBadge column="medium_of_instruction" value={child.medium_of_instruction} />} />
            <Field icon={<IconId className="size-4" />} label="Birth Cert No" value={child.birth_certificate_number || <span className="text-muted-foreground/50">Not provided</span>} />
            {child.category && (
              <Field icon={<IconCategory className="size-4" />} label="Category" value={<ReviewBadge column="category" value={child.category} />} />
            )}
            {child.overseas_arrival_date && (
              <Field icon={<IconFlag className="size-4" />} label="Overseas Arrival" value={child.overseas_arrival_date} />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <IconUsers className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Guardians</CardTitle>
              <Badge variant="secondary" className="ms-auto">{guardians.length}</Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-3">
            {guardians.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No guardians selected</p>
            ) : (
              guardians.map((g) => (
                <div key={g.id} className="group rounded-lg border p-3 transition-colors hover:bg-muted/30">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="text-xs">{getInitials(g.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{g.full_name}</p>
                        <ReviewBadge column="relationship_type" value={g.relationship_type} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IconId className="size-3 shrink-0" /> {g.nic_number}
                        </span>
                        {g.contact_phone && (
                          <span className="flex items-center gap-1">
                            <IconPhone className="size-3 shrink-0" /> {g.contact_phone}
                          </span>
                        )}
                        {g.contact_email && (
                          <span className="flex items-center gap-1">
                            <IconMail className="size-3 shrink-0" /> {g.contact_email}
                          </span>
                        )}
                        {g.occupation && (
                          <span className="flex items-center gap-1">
                            <IconBriefcase className="size-3 shrink-0" /> {g.occupation}
                          </span>
                        )}
                        {g.income_level && (
                          <span className="flex items-center gap-1">
                            <IconCoin className="size-3 shrink-0" /> {g.income_level.replace(/_/g, " ")}
                          </span>
                        )}
                        {g.govt_service_years != null && (
                          <span className="flex items-center gap-1">
                            <IconBriefcase className="size-3 shrink-0" /> {g.govt_service_years} yr{g.govt_service_years !== 1 ? "s" : ""}
                          </span>
                        )}
                        {g.workplace_name && (
                          <span className="flex items-center gap-1">
                            <IconBuilding className="size-3 shrink-0" /> {g.workplace_name}
                          </span>
                        )}
                        {g.workplace_address && (
                          <span className="flex items-center gap-1 col-span-2">
                            <IconMapPin className="size-3 shrink-0" /> {g.workplace_address}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {g.is_school_staff && <Badge variant="outline" className="text-[10px] h-4">School Staff</Badge>}
                        {g.is_past_pupil && <Badge variant="outline" className="text-[10px] h-4">Past Pupil</Badge>}
                        {g.is_govt_employee && <Badge variant="outline" className="text-[10px] h-4">Govt Employee</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <IconMapPin className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Addresses</CardTitle>
              <Badge variant="secondary" className="ms-auto">{selectedAddresses.length}</Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-3">
            {selectedAddresses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No addresses selected</p>
            ) : (
              selectedAddresses.map((entry) => {
                const addr = addressMap.get(entry.workspace_address_id)
                if (!addr) return null
                return (
                  <div key={entry.workspace_address_id} className="group rounded-lg border p-3 transition-colors hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <IconHome className="size-4 shrink-0 text-muted-foreground" />
                        <p className="text-sm font-medium truncate">{addr.name}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {entry.is_primary && <Badge variant="default" className="text-[10px] h-4">Primary</Badge>}
                        <ReviewBadge column="address_type" value={entry.address_type} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{addr.full_address}</p>
                    <div className="mt-1.5">
                      <ReviewBadge column="residence_type" value={entry.residence_type} />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {siblingStudents.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <IconSchool className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm">Siblings</CardTitle>
                <Badge variant="secondary" className="ms-auto">{siblingStudents.length}</Badge>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-2">
              {siblingStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="text-[10px]">{getInitials(s.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Grade {s.current_grade ?? "N/A"}
                      {s.admission_number && <span className="ms-2">&middot; {s.admission_number}</span>}
                    </p>
                  </div>
                  <ReviewBadge column="medium_of_instruction" value={s.medium_of_instruction} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <IconFileText className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm">Documents</CardTitle>
              <Badge variant="secondary" className="ms-auto">{uploadedCount} uploaded</Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {uploadedCount === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {documents.filter((d) => d.status === "uploaded").map((doc) => {
                  const isImage = doc.file_type?.startsWith("image/")
                  return (
                    <div key={doc.tempId} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                      <div className="size-9 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {isImage ? (
                          <img src={doc.file_url} alt={doc.file_name ?? ""} className="size-full object-cover" />
                        ) : (
                          <IconFileText className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{doc.doc_type}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{doc.file_name ?? ""}</p>
                      </div>
                      <IconCheck className="size-4 text-green-600 shrink-0" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center pt-2 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex items-center gap-3">
          <AlertDialog>
            <AlertDialogTrigger render={
              <Button>
                <IconCheck className="size-4" />
                Complete Enrollment
              </Button>
            } />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete Enrollment</AlertDialogTitle>
                <AlertDialogDescription>
                  After completing, this enrollment cannot be edited. Are you sure?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onComplete}>Complete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
