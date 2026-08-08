"use client"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { IconAlertTriangle, IconUser, IconUserShield } from "@tabler/icons-react"
import type { Child, Guardian } from "@/lib/api-client/types.gen"
import type { ChildUniquenessCheckType } from "@/hooks/use-child-uniqueness"

interface UniquenessAlertProps {
  childDuplicates: Child[]
  guardianDuplicates: Guardian[]
  checkType: ChildUniquenessCheckType
  isChecking: boolean
}

const CHECK_LABELS: Record<ChildUniquenessCheckType, string> = {
  birth_certificate_number: "Birth Certificate Number",
  nic: "NIC Number",
  full_name: "Full Name",
}

export function UniquenessAlert({
  childDuplicates,
  guardianDuplicates,
  checkType,
  isChecking,
}: UniquenessAlertProps) {
  if (isChecking) {
    return (
      <p className="text-xs text-muted-foreground animate-pulse py-1">
        Checking for duplicates...
      </p>
    )
  }

  const hasChildren = childDuplicates.length > 0
  const hasGuardians = guardianDuplicates.length > 0
  if (!hasChildren && !hasGuardians) return null

  const label = CHECK_LABELS[checkType]
  const totalCount = childDuplicates.length + guardianDuplicates.length

  return (
    <div className="flex items-center gap-1.5 py-1">
      <IconAlertTriangle className="size-3.5 text-destructive shrink-0" />
      <HoverCard>
        <HoverCardTrigger>
          <span className="text-xs text-destructive underline-offset-2 hover:underline cursor-pointer">
            {totalCount} similar {totalCount === 1 ? "record" : "records"} found for this {label.toLowerCase()}
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-0" side="bottom">
          <div className="space-y-2 p-2.5">
            {hasChildren && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Matching children ({childDuplicates.length}):
                </p>
                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                  {childDuplicates.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-start gap-2 rounded-md border p-2 text-sm"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <IconUser className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-xs">
                          {child.full_name}
                        </p>
                        {child.name_with_initials && (
                          <p className="truncate text-xs text-muted-foreground">
                            {child.name_with_initials}
                          </p>
                        )}
                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                          {child.birth_certificate_number && (
                            <span>BC: {child.birth_certificate_number}</span>
                          )}
                          {child.nic && <span>NIC: {child.nic}</span>}
                          {child.date_of_birth && (
                            <span>DOB: {child.date_of_birth}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasGuardians && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Matching guardians ({guardianDuplicates.length}):
                </p>
                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                  {guardianDuplicates.map((guardian) => (
                    <div
                      key={guardian.id}
                      className="flex items-start gap-2 rounded-md border p-2 text-sm"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <IconUserShield className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-xs">
                          {guardian.full_name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                          <span>{guardian.relationship_type}</span>
                          {guardian.nic_number && (
                            <span>NIC: {guardian.nic_number}</span>
                          )}
                          {guardian.contact_phone && (
                            <span>Tel: {guardian.contact_phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
