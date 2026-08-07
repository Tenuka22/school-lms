"use client"

import { useState, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { apiClient } from "@/lib/api-client"
import {
  listGuardiansOptions,
  listGuardiansQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import { cn } from "@/lib/utils"
import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
  IconCheck,
  IconUser,
  IconPencil,
} from "@tabler/icons-react"
import type { Guardian } from "@/lib/api-client/types.gen"
import { getEnumStyle } from "@/lib/enum-badge"
import type { Blacklist } from "@/lib/api-client/types.gen"
import {
  GuardianProfileCard,
  StaffBadge,
  PastPupilBadge,
  BlacklistBadge,
} from "./guardian-helpers"
import { CreateGuardianDialog } from "./create-guardian-dialog"
import { EditGuardianDialog } from "./edit-guardian-dialog"

const PAGE_SIZE = 8

interface Props {
  selectedIds: string[]
  onSelect: (id: string) => void
  onDeselect: (id: string) => void
  enrollmentId?: string
}

export function GuardianSelector({ selectedIds, onSelect, onDeselect, enrollmentId }: Props) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [editTarget, setEditTarget] = useState<Guardian | null>(null)

  const { data: guardians } = useQuery(
    listGuardiansOptions({ client: apiClient })
  )

  const filtered = (guardians ?? []).filter((g) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      g.full_name.toLowerCase().includes(q) ||
      g.nic_number.toLowerCase().includes(q) ||
      (g.contact_phone ?? "").includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const pagedIds = useMemo(() => paged.map((g) => g.id), [paged])

  const { data: blacklistedMap } = useQuery({
    queryKey: ["blacklist", "active", pagedIds],
    queryFn: async () => {
      if (pagedIds.length === 0) return {}
      const res = await apiClient.get({
        url: "/api/blacklist",
        query: { guardian_ids: pagedIds },
      })
      if (res.error) return {}
      const entries = (res.data ?? []) as Blacklist[]
      const map: Record<string, Blacklist> = {}
      for (const e of entries) {
        map[e.guardian_id] = e
      }
      return map
    },
    enabled: pagedIds.length > 0,
  })

  const handlePageChange = (p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)))
  }

  const handleCreated = useCallback(() => {
    setPage(0)
  }, [])

  return (
    <div className="space-y-3">
      <div className="relative">
        <IconSearch className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, NIC, phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className="pl-8"
        />
      </div>

      <CreateGuardianDialog
        enrollmentId={enrollmentId}
        onCreated={handleCreated}
        onEditExisting={(g) => setEditTarget(g)}
      />

      <ScrollArea className="h-[360px] pr-2">
        <div className="space-y-1">
          {paged.map((g) => {
            const isSelected = selectedIds.includes(g.id)
            const blacklisted = blacklistedMap?.[g.id]
            return (
              <HoverCard key={g.id}>
                <HoverCardTrigger>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      isSelected ? onDeselect(g.id) : onSelect(g.id)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        isSelected ? onDeselect(g.id) : onSelect(g.id)
                    }}
                    className={cn(
                      "group flex w-full cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <IconUser className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{g.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.relationship_type} &middot; {g.nic_number}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{g.contact_phone}</span>
                        {g.contact_email && (
                          <span className="truncate">{g.contact_email}</span>
                        )}
                        {g.occupation && <span>{g.occupation}</span>}
                        {g.workplace_name && <span>{g.workplace_name}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {blacklisted && <BlacklistBadge entry={blacklisted} />}
                        {g.is_school_staff && <StaffBadge guardianId={g.id} />}
                        {g.is_past_pupil && (
                          <PastPupilBadge guardianId={g.id} />
                        )}
                        {g.is_govt_employee && (
                          <span
                            className={`inline-flex items-center rounded-sm border px-1 py-0 text-[10px] font-medium ${getEnumStyle("guardian_flag", "govt") ?? ""}`}
                          >
                            Govt
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditTarget(g)
                      }}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent-foreground/10"
                      aria-label="Edit guardian"
                    >
                      <IconPencil className="size-3.5 text-muted-foreground" />
                    </button>
                    {isSelected && (
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary">
                        <IconCheck className="size-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent
                  side="right"
                  align="start"
                  sideOffset={8}
                  className="p-3"
                >
                  <GuardianProfileCard g={g} />
                </HoverCardContent>
              </HoverCard>
            )
          })}
          {paged.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No guardians found
            </p>
          )}
        </div>
      </ScrollArea>

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
      {editTarget && (
        <EditGuardianDialog
          guardian={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null)
          }}
          onSaved={() => {
            setEditTarget(null)
            queryClient.invalidateQueries({
              queryKey: listGuardiansQueryKey({ client: apiClient }),
            })
          }}
        />
      )}
    </div>
  )
}
