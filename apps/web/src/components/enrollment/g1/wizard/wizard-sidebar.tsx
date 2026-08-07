"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { IconFileText, IconPhoto, IconCalendar, IconMapPin, IconUsers, IconSchool } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { listSchoolsOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import type { ChildFormData } from "./wizard-step-child"
import type { DocumentFormData } from "./wizard-step-documents"
import type { ElectoralEntry } from "./wizard-step-electoral"
import { GuardianSelector } from "./guardian-selector"
import { AddressSelector } from "./address-selector"
import { SiblingSelector } from "./sibling-selector"
import { getInitials } from "@/lib/utils"

interface ChildSummaryProps {
  data: ChildFormData
}

function ChildSummary({ data }: ChildSummaryProps) {
  const coreFields = [data.full_name, data.date_of_birth, data.gender]
  const filledCore = coreFields.filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar size="lg" className="size-12">
          <AvatarFallback className="text-base font-semibold">
            {data.full_name ? getInitials(data.full_name) : "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm leading-tight font-medium">
            {data.full_name || "Child Profile"}
          </p>
          <p className="text-xs text-muted-foreground">
            {filledCore}/3 required fields
          </p>
        </div>
      </div>
      <div className="space-y-1.5 text-xs">
        {data.full_name && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium text-foreground">
              {data.full_name}
            </span>
          </div>
        )}
        {data.name_with_initials && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Initials</span>
            <span className="text-foreground">{data.name_with_initials}</span>
          </div>
        )}
        {data.date_of_birth && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">DOB</span>
            <span className="text-foreground">{data.date_of_birth}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Gender</span>
          <span className="text-foreground">{data.gender}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nationality</span>
          <span className="text-foreground">{data.nationality}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Medium</span>
          <span className="text-foreground">{data.medium_of_instruction}</span>
        </div>
      </div>
    </div>
  )
}

interface ElectoralSummaryProps {
  entries: ElectoralEntry[]
}

function ElectoralSummary({ entries }: ElectoralSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground">
          Electoral Entries ({entries.length})
        </h4>
        <p className="text-xs text-muted-foreground">
          Summary of entered electoral register data.
        </p>
      </div>
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <IconCalendar className="mb-2 size-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No entries yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {entry.electoral_year || "—"}
                </Badge>
                {entry.voter_names.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px] gap-0.5">
                    <IconUsers className="size-2.5" />
                    {entry.voter_names.length}
                  </Badge>
                )}
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {entry.polling_district && (
                  <div className="flex items-center gap-1.5">
                    <IconMapPin className="size-3 shrink-0" />
                    <span>{entry.polling_district}</span>
                    {entry.polling_division && <span>/ {entry.polling_division}</span>}
                  </div>
                )}
                {entry.gn_name && (
                  <div className="flex items-center gap-1.5">
                    <IconMapPin className="size-3 shrink-0" />
                    <span>{entry.gn_name}-{entry.gn_number}</span>
                  </div>
                )}
                {entry.village_street && (
                  <p className="truncate">{entry.village_street}</p>
                )}
                {entry.household_head_name && (
                  <p className="truncate">Head: {entry.household_head_name}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface GuardianDirectoryProps {
  selectedIds: string[]
  onSelect: (id: string) => void
  onDeselect: (id: string) => void
  enrollmentId?: string
}

function GuardianDirectory({
  selectedIds,
  onSelect,
  onDeselect,
  enrollmentId,
}: GuardianDirectoryProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground">
          Guardian Directory
        </h4>
        <p className="text-xs text-muted-foreground">
          Search, browse, and select guardians.
        </p>
      </div>
      <GuardianSelector
        selectedIds={selectedIds}
        onSelect={onSelect}
        onDeselect={onDeselect}
        enrollmentId={enrollmentId}
      />
    </div>
  )
}

interface AddressDirectoryProps {
  selectedIds: string[]
  onSelect: (id: string) => void
  onDeselect: (id: string) => void
}

function AddressDirectory({
  selectedIds,
  onSelect,
  onDeselect,
}: AddressDirectoryProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground">
          Address Directory
        </h4>
        <p className="text-xs text-muted-foreground">
          Search, browse, and select addresses.
        </p>
      </div>
      <AddressSelector
        selectedIds={selectedIds}
        onSelect={onSelect}
        onDeselect={onDeselect}
      />
    </div>
  )
}

interface SiblingDirectoryProps {
  enrollmentId: string
  schoolId: string
  selectedStudentIds: string[]
  onSelect: (id: string) => void
  onDeselect: (id: string) => void
}

function SiblingDirectory({
  enrollmentId,
  schoolId,
  selectedStudentIds,
  onSelect,
  onDeselect,
}: SiblingDirectoryProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground">
          Student Directory
        </h4>
        <p className="text-xs text-muted-foreground">
          Search and select siblings from enrolled students at this school.
        </p>
      </div>
      <SiblingSelector
        enrollmentId={enrollmentId}
        schoolId={schoolId}
        selectedStudentIds={selectedStudentIds}
        onSelect={onSelect}
        onDeselect={onDeselect}
      />
    </div>
  )
}

const REQUIRED_DOC_LABELS: Record<string, string> = {
  BirthCertificate: "Birth Certificate",
  GuardianNIC: "Guardian NIC",
  ResidenceProof: "Residence Proof",
  StaffAppointmentLetter: "Staff Appointment Letter",
  StaffServiceCertificate: "Staff Service Certificate",
  AlumniCertificate: "Alumni Certificate",
  GovtEmployeeCertificate: "Govt Employee Certificate",
  IncomeCertificate: "Income Certificate",
}

interface DocumentsPreviewProps {
  documents: DocumentFormData[]
}

function DocumentsPreview({ documents }: DocumentsPreviewProps) {
  const uploaded = documents.filter((d) => d.status === "uploaded")
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground">Documents</h4>
        <p className="text-xs text-muted-foreground">
          {uploaded.length} of {documents.length} uploaded
        </p>
      </div>
      {uploaded.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <IconPhoto className="mb-2 size-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No files uploaded yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {uploaded.map((doc) => {
            const label = REQUIRED_DOC_LABELS[doc.doc_type] ?? doc.doc_type
            const isImage = doc.file_type?.startsWith("image/")
            return (
              <div
                key={doc.tempId}
                className="flex items-start gap-2.5 rounded-lg border p-2"
              >
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {isImage ? (
                    <img
                      src={doc.file_url}
                      alt={doc.file_name ?? label}
                      className="size-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <IconFileText className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {doc.file_name ?? "Unknown"}
                  </p>
                </div>
                <Badge
                  className="mt-0.5 h-4 px-1.5 text-[10px]"
                  variant="outline"
                >
                  Uploaded
                </Badge>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface SchoolPreferencesSummaryProps {
  preferredSchoolIds: string[]
  closerSchoolExists: boolean
}

function SchoolPreferencesSummary({ preferredSchoolIds, closerSchoolExists }: SchoolPreferencesSummaryProps) {
  const { data: allSchools = [] } = useQuery(listSchoolsOptions({ client: apiClient }))
  const selectedSchools = preferredSchoolIds
    .map((id) => allSchools.find((s) => s.id === id))
    .filter(Boolean)

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground">Selected Schools</h4>
        <p className="text-xs text-muted-foreground">
          {preferredSchoolIds.length} of 6 maximum
        </p>
      </div>
      {selectedSchools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <IconSchool className="mb-2 size-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No schools selected yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {selectedSchools.map((school, index) => (
            <div
              key={school!.id}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-2"
            >
              <Badge variant="secondary" className="size-5 shrink-0 justify-center rounded-full text-[10px]">
                {index + 1}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{school!.name_si}</p>
                {school!.name_en && (
                  <p className="truncate text-[10px] text-muted-foreground">{school!.name_en}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {closerSchoolExists && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Closer school exists: Yes
          </p>
        </div>
      )}
    </div>
  )
}

interface SidebarProps {
  currentStep: number
  childData: ChildFormData
  enrollmentId: string
  schoolId: string
  electoralEntries?: ElectoralEntry[]
  selectedGuardianIds?: string[]
  onGuardianSelect?: (id: string) => void
  onGuardianDeselect?: (id: string) => void
  selectedAddressIds?: string[]
  onAddressSelect?: (id: string) => void
  onAddressDeselect?: (id: string) => void
  preferredSchoolIds?: string[]
  closerSchoolExists?: boolean
  selectedSiblingIds?: string[]
  onSiblingSelect?: (id: string) => void
  onSiblingDeselect?: (id: string) => void
  documents?: DocumentFormData[]
}

export function WizardSidebar({
  currentStep,
  childData,
  enrollmentId,
  schoolId,
  electoralEntries,
  selectedGuardianIds,
  onGuardianSelect,
  onGuardianDeselect,
  selectedAddressIds,
  onAddressSelect,
  onAddressDeselect,
  preferredSchoolIds,
  closerSchoolExists,
  selectedSiblingIds,
  onSiblingSelect,
  onSiblingDeselect,
  documents,
}: SidebarProps) {
  if (currentStep === 8) return null

  return (
    <div className="w-80 shrink-0 space-y-6 border-r pr-4">
      {currentStep === 1 && <ChildSummary data={childData} />}
      {currentStep === 2 &&
        selectedGuardianIds &&
        onGuardianSelect &&
        onGuardianDeselect && (
          <GuardianDirectory
            selectedIds={selectedGuardianIds}
            onSelect={onGuardianSelect}
            onDeselect={onGuardianDeselect}
            enrollmentId={enrollmentId}
          />
        )}
      {currentStep === 3 && electoralEntries && (
        <ElectoralSummary entries={electoralEntries} />
      )}
      {currentStep === 4 &&
        selectedAddressIds &&
        onAddressSelect &&
        onAddressDeselect && (
          <AddressDirectory
            selectedIds={selectedAddressIds}
            onSelect={onAddressSelect}
            onDeselect={onAddressDeselect}
          />
        )}
      {currentStep === 5 && preferredSchoolIds && (
        <SchoolPreferencesSummary
          preferredSchoolIds={preferredSchoolIds}
          closerSchoolExists={closerSchoolExists ?? false}
        />
      )}
      {currentStep === 6 &&
        selectedSiblingIds &&
        onSiblingSelect &&
        onSiblingDeselect && (
          <SiblingDirectory
            enrollmentId={enrollmentId}
            schoolId={schoolId}
            selectedStudentIds={selectedSiblingIds}
            onSelect={onSiblingSelect}
            onDeselect={onSiblingDeselect}
          />
        )}
      {currentStep === 7 && documents && (
        <DocumentsPreview documents={documents} />
      )}
    </div>
  )
}
