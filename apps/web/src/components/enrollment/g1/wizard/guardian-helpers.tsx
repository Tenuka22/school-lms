"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { apiClient } from "@/lib/api-client"
import {
  listWorkspaceAddressesOptions,
  listWorkspaceAddressesQueryKey,
  listStaffDetailsOptions,
  listPastPupilDetailsOptions,
  listStudentsOptions,
  createWorkspaceAddressMutation,
} from "@/lib/api-client/@tanstack/react-query.gen"
import type { SchoolSummary, Blacklist } from "@/lib/api-client/types.gen"
import { useDebounce } from "@/hooks/use-debounce"
import { queryClient } from "@/router"
import { toastApiError } from "@/lib/api-error"
import { toast } from "sonner"
import {
  IconChevronDown,
  IconCheck,
  IconPlus,
  IconUser,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { getEnumLabel, getEnumStyle } from "@/lib/enum-badge"
import { CreateWorkspaceAddressDialog } from "./create-workspace-address-dialog"
import type { Guardian } from "@/lib/api-client/types.gen"

export const RELATIONSHIP_OPTIONS = ["Father", "Mother", "Guardian", "Other"]

export const CATEGORY_INFO = [
  {
    key: "is_school_staff",
    label: "School Staff",
    weight: "25%",
    desc: "Parent is a permanent staff member of the applied school",
  },
  {
    key: "is_past_pupil",
    label: "Past Pupil",
    weight: "6%",
    desc: "Parent studied at the applied school",
  },
  {
    key: "is_govt_employee",
    label: "Govt Employee",
    weight: "4%",
    desc: "Parent is a permanent government employee (non-staff)",
  },
] as const

export function SchoolCombobox({
  value,
  onChange,
}: {
  value: string | null
  onChange: (v: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data: schools = [] } = useQuery({
    queryKey: ["list-schools", debouncedSearch],
    queryFn: async () => {
      const res = await apiClient.get({
        url: "/api/schools",
        query: { search: debouncedSearch || undefined },
      })
      if (res.error) {
        console.error("School list error:", res.error)
        return []
      }
      return (res.data ?? []) as SchoolSummary[]
    },
    enabled: open,
  })

  const selected = schools.find((s) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
          >
            {selected
              ? `${selected.name_si}${selected.name_en && selected.name_en !== selected.name_si ? ` · ${selected.name_en}` : ""}`
              : "Search school..."}
            <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-96 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by school name..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No schools found.</CommandEmpty>
            <CommandGroup>
              {schools.map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.id}
                  onSelect={() => {
                    onChange(s.id)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <div className="flex flex-col">
                    <span>{s.name_si}</span>
                    {s.name_en && (
                      <span className="text-xs text-muted-foreground">
                        {s.name_en}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function StudentCombobox({
  value,
  onChange,
}: {
  value: string | null
  onChange: (v: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data: students = [] } = useQuery({
    ...listStudentsOptions({
      client: apiClient,
      query: { search: debouncedSearch || undefined },
    }),
    enabled: open,
  })

  const selected = students.find((s: any) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
          >
            {selected
              ? `${selected.full_name}${selected.admission_number ? ` #${selected.admission_number}` : ""}`
              : "Search student..."}
            <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-96 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or ID..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No students found.</CommandEmpty>
            <CommandGroup>
              {students.map((s: any) => (
                <CommandItem
                  key={s.id}
                  value={s.id}
                  onSelect={() => {
                    onChange(s.id)
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <div className="flex flex-col">
                    <span>{s.full_name}</span>
                    {s.admission_number && (
                      <span className="text-xs text-muted-foreground">
                        #{s.admission_number}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function GuardianProfileCard({ g }: { g: Guardian }) {
  return (
    <div className="w-72 space-y-2 text-xs">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-full bg-muted">
          <IconUser className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{g.full_name}</p>
          <p className="text-muted-foreground">{g.relationship_type}</p>
        </div>
      </div>
      <div className="space-y-1 border-t pt-2">
        <p>
          <span className="text-muted-foreground">NIC:</span> {g.nic_number}
        </p>
        <p>
          <span className="text-muted-foreground">Phone:</span>{" "}
          {g.contact_phone}
        </p>
        {g.contact_email && (
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            {g.contact_email}
          </p>
        )}
        {g.occupation && (
          <p>
            <span className="text-muted-foreground">Occupation:</span>{" "}
            {g.occupation}
          </p>
        )}
        {g.workplace_name && (
          <p>
            <span className="text-muted-foreground">Workplace:</span>{" "}
            {g.workplace_name}
          </p>
        )}
        {g.workplace_address && (
          <p>
            <span className="text-muted-foreground">Workplace Address:</span>{" "}
            {g.workplace_address}
          </p>
        )}
        {g.income_level && (
          <p>
            <span className="text-muted-foreground">Income:</span>{" "}
            <span
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${getEnumStyle("income_level", g.income_level) ?? "border-border bg-muted text-muted-foreground"}`}
            >
              {getEnumLabel("income_level", g.income_level)}
            </span>
          </p>
        )}
        {g.is_govt_employee && g.govt_service_years != null && (
          <p>
            <span className="text-muted-foreground">Govt Service:</span>{" "}
            {g.govt_service_years} years
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-1 border-t pt-1">
        {g.is_school_staff && <StaffBadge guardianId={g.id} />}
        {g.is_past_pupil && <PastPupilBadge guardianId={g.id} />}
        {g.is_govt_employee && (
          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${getEnumStyle("guardian_flag", "govt") ?? ""}`}
          >
            Govt
          </span>
        )}
      </div>
    </div>
  )
}

export function BlacklistBadge({ entry }: { entry: Blacklist }) {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <span className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
          <IconAlertTriangle className="size-3" />
          Blacklisted
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" sideOffset={4} className="w-64 p-3 text-xs">
        <div className="space-y-1">
          <p className="font-medium text-destructive">Blacklisted</p>
          <p className="text-muted-foreground">{entry.reason}</p>
          <p className="text-muted-foreground/60">
            Since {new Date(entry.blacklisted_at ?? '').toLocaleDateString()}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export function StaffBadge({ guardianId }: { guardianId: string }) {
  const { data: staffDetails } = useQuery({
    ...listStaffDetailsOptions({
      client: apiClient,
      query: { guardian_id: guardianId },
    }),
    enabled: !!guardianId,
  })
  const detail = Array.isArray(staffDetails) ? staffDetails[0] : undefined
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${getEnumStyle("guardian_flag", "staff") ?? ""}`}
    >
      <span>Staff</span>
      {detail?.staff_type && (
        <span
          className={`inline-flex items-center rounded-sm border px-0.5 py-0 text-[9px] font-medium ${getEnumStyle("staff_type", detail.staff_type) ?? ""}`}
        >
          {getEnumLabel("staff_type", detail.staff_type)}
        </span>
      )}
      {detail?.employee_id && (
        <span className="text-muted-foreground/60">#{detail.employee_id}</span>
      )}
    </span>
  )
}

export function PastPupilBadge({ guardianId }: { guardianId: string }) {
  const { data: ppDetails } = useQuery({
    ...listPastPupilDetailsOptions({
      client: apiClient,
      query: { guardian_id: guardianId },
    }),
    enabled: !!guardianId,
  })
  const detail = Array.isArray(ppDetails) ? ppDetails[0] : undefined
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${getEnumStyle("guardian_flag", "past_pupil") ?? ""}`}
    >
      <span>Alumni</span>
      {detail?.highest_grade && (
        <span className="text-muted-foreground/60">
          {detail.highest_grade.replace(/_/g, " ")}
        </span>
      )}
      {detail?.year_left && (
        <span className="text-muted-foreground/60">{detail.year_left}</span>
      )}
      {detail?.student_id && (
        <span className="text-muted-foreground/60">#{detail.student_id}</span>
      )}
    </span>
  )
}

export function WorkspaceAddressSelect({
  onChange,
}: {
  onChange: (name: string, address: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedLabel, setSelectedLabel] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data: addresses = [] } = useQuery(
    listWorkspaceAddressesOptions({
      client: apiClient,
      query: { search: debouncedSearch || undefined },
    })
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return addresses
    const q = search.toLowerCase()
    return addresses.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.full_address.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        (a.street_1 && a.street_1.toLowerCase().includes(q))
    )
  }, [addresses, search])

  const createMutation = useMutation({
    ...createWorkspaceAddressMutation({ client: apiClient }),
  })

  return (
    <div className="space-y-2">
      <Popover open={openCreate ? false : open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedLabel || (
                <span className="font-normal text-muted-foreground">
                  Select or create workspace address...
                </span>
              )}
              <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          }
        />
        <PopoverContent className="w-96 p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search addresses..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No addresses found.</CommandEmpty>
              <CommandGroup>
                {filtered.map((addr) => (
                  <CommandItem
                    key={addr.id}
                    value={addr.id}
                    onSelect={() => {
                      onChange(addr.name, addr.full_address)
                      setSelectedLabel(addr.name)
                      setOpen(false)
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{addr.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {addr.full_address}
                      </span>
                    </div>
                    <IconCheck
                      className={cn(
                        "ml-auto size-4 shrink-0",
                        selectedLabel === addr.name
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpenCreate(true)
                    setOpen(false)
                  }}
                >
                  <IconPlus className="mr-2 size-4" />
                  Create new address
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateWorkspaceAddressDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSubmit={async (data) => {
          try {
            const addr = await createMutation.mutateAsync({ body: data, client: apiClient })
            queryClient.invalidateQueries({
              queryKey: listWorkspaceAddressesQueryKey({ client: apiClient }),
            })
            toast.success(`${addr.name} created`)
            onChange(addr.name, addr.full_address)
            setSelectedLabel(addr.name)
            setOpen(false)
            setOpenCreate(false)
          } catch (err) {
            toastApiError(err, "Failed to create address")
          }
        }}
        isPending={createMutation.isPending}
      />
    </div>
  )
}
