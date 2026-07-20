"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox, ComboboxContent, ComboboxItem, ComboboxList, ComboboxInput, ComboboxEmpty } from "@/components/ui/combobox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { apiClient } from "@/lib/api-client"
import { createGuardianMutation, listGuardiansOptions, listGuardiansQueryKey, listWorkspaceAddressesOptions, createWorkspaceAddressMutation, updateGuardianMutation, listStaffDetailsOptions, listPastPupilDetailsOptions, listStudentsOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import { cn } from "@/lib/utils"
import { getEnumLabel, getEnumStyle } from "@/lib/enum-badge"
import { IconChevronLeft, IconChevronRight, IconChevronDown, IconPlus, IconSearch, IconCheck, IconUser, IconPencil } from "@tabler/icons-react"
import type { Guardian, CreateGuardianBody } from "@/lib/api-client/types.gen"
import professions from "professions"

const PAGE_SIZE = 8

function GuardianProfileCard({ g }: { g: Guardian }) {
  return (
    <div className="space-y-2 text-xs w-72">
      <div className="flex items-center gap-2.5">
        <div className="size-9 rounded-full bg-muted flex items-center justify-center">
          <IconUser className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-sm">{g.full_name}</p>
          <p className="text-muted-foreground">{g.relationship_type}</p>
        </div>
      </div>
      <div className="space-y-1 border-t pt-2">
        <p><span className="text-muted-foreground">NIC:</span> {g.nic_number}</p>
        <p><span className="text-muted-foreground">Phone:</span> {g.contact_phone}</p>
        {g.contact_email && <p><span className="text-muted-foreground">Email:</span> {g.contact_email}</p>}
        {g.occupation && <p><span className="text-muted-foreground">Occupation:</span> {g.occupation}</p>}
        {g.workplace_name && <p><span className="text-muted-foreground">Workplace:</span> {g.workplace_name}</p>}
        {g.workplace_address && <p><span className="text-muted-foreground">Workplace Address:</span> {g.workplace_address}</p>}
        {g.income_level && <p><span className="text-muted-foreground">Income:</span> <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${getEnumStyle("income_level", g.income_level) ?? "bg-muted text-muted-foreground border-border"}`}>{getEnumLabel("income_level", g.income_level)}</span></p>}
        {g.is_govt_employee && g.govt_service_years != null && <p><span className="text-muted-foreground">Govt Service:</span> {g.govt_service_years} years</p>}
      </div>
      <div className="flex flex-wrap gap-1 pt-1 border-t">
        {g.is_school_staff && <StaffBadge guardianId={g.id} />}
        {g.is_past_pupil && <PastPupilBadge guardianId={g.id} />}
        {g.is_govt_employee && <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${getEnumStyle("guardian_flag", "govt") ?? ""}`}>Govt</span>}
      </div>
    </div>
  )
}

const RELATIONSHIP_OPTIONS = ["Father", "Mother", "Guardian", "Other"]

const CATEGORY_INFO = [
  { key: "is_school_staff", label: "School Staff", weight: "25%", desc: "Parent is a permanent staff member of the applied school" },
  { key: "is_past_pupil", label: "Past Pupil", weight: "6%", desc: "Parent studied at the applied school" },
  { key: "is_govt_employee", label: "Govt Employee", weight: "4%", desc: "Parent is a permanent government employee (non-staff)" },
] as const

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

const defaultValues: CreateGuardianBody & {
  past_pupil_highest_grade: string | null
  past_pupil_year_left: number | null
  past_pupil_left_reason: string | null
  staff_school_id: string | null
  past_pupil_school_id: string | null
} = {
  full_name: "",
  nic_number: "",
  contact_phone: "0",
  contact_email: null,
  occupation: null,
  workplace_name: null,
  workplace_address: null,
  relationship_type: "Guardian",
  is_school_staff: false,
  staff_type: null,
  employee_id: null,
  staff_school_id: null,
  is_past_pupil: false,
  is_govt_employee: false,
  income_level: null,
  govt_service_years: null,
  past_pupil_student_id: null,
  past_pupil_highest_grade: null,
  past_pupil_year_left: null,
  past_pupil_left_reason: null,
  past_pupil_school_id: null,
}

const createGuardianSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  nic_number: z.string().min(1, "NIC number is required"),
  contact_phone: z.string().min(1, "Phone number is required"),
  contact_email: z.string().nullable(),
  occupation: z.string().nullable(),
  workplace_name: z.string().nullable(),
  workplace_address: z.string().nullable(),
  relationship_type: z.string().min(1),
  is_school_staff: z.boolean(),
  staff_type: z.string().nullable(),
  employee_id: z.string().nullable(),
  is_past_pupil: z.boolean(),
  is_govt_employee: z.boolean(),
  income_level: z.string().nullable(),
  govt_service_years: z.number().nullable(),
  past_pupil_student_id: z.string().nullable(),
  past_pupil_highest_grade: z.string().nullable(),
  past_pupil_year_left: z.number().nullable(),
  past_pupil_left_reason: z.string().nullable(),
})

function WorkspaceAddressSelect({
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
    listWorkspaceAddressesOptions({ client: apiClient, query: { search: debouncedSearch || undefined } }),
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return addresses
    const q = search.toLowerCase()
    return addresses.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.full_address.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        (a.street_1 && a.street_1.toLowerCase().includes(q)),
    )
  }, [addresses, search])

  const createMutation = useMutation({
    ...createWorkspaceAddressMutation({ client: apiClient }),
    onSuccess: (addr) => {
      onChange(addr.name, addr.full_address)
      setSelectedLabel(addr.name)
      setOpen(false)
      setOpenCreate(false)
    },
  })

  return (
    <div className="space-y-2">
      <Popover open={openCreate ? false : open} onOpenChange={setOpen}>
        <PopoverTrigger render={
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selectedLabel || <span className="text-muted-foreground font-normal">Select or create workspace address...</span>}
            <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        } />
        <PopoverContent className="w-[--anchor-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search addresses..." value={search} onValueChange={setSearch} />
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
                      <span className="text-xs text-muted-foreground">{addr.full_address}</span>
                    </div>
                    <IconCheck
                      className={cn(
                        "ml-auto size-4 shrink-0",
                        selectedLabel === addr.name ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={() => { setOpenCreate(true); setOpen(false) }}>
                  <IconPlus className="mr-2 size-4" />
                  Create new address
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Workspace Address</DialogTitle>
          </DialogHeader>
          <CreateWorkspaceAddressForm
            onSubmit={(data) => createMutation.mutate({ body: data, client: apiClient })}
            onCancel={() => setOpenCreate(false)}
            isPending={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

const addressFormDefaults = {
  name: "",
  building: "",
  street_1: "",
  street_2: "",
  city: "Galle",
  state: "",
  postal_code: "",
  country: "Sri Lanka",
}

const addressSchema = z.object({
  name: z.string().min(1, "Label is required"),
  building: z.string().optional(),
  street_1: z.string().min(1, "Street address is required"),
  street_2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().min(1, "Country is required"),
})

function CreateWorkspaceAddressForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (data: {
    name: string
    building?: string | null
    street_1: string
    street_2?: string | null
    city: string
    state?: string | null
    postal_code?: string | null
    country: string
  }) => void
  onCancel: () => void
  isPending: boolean
}) {
  const form = useForm({
    defaultValues: addressFormDefaults,
    validators: { onSubmit: addressSchema as any },
    onSubmit: async ({ value }) => {
      const data = value as typeof addressFormDefaults
      onSubmit({
        name: data.name,
        building: data.building || null,
        street_1: data.street_1,
        street_2: data.street_2 || null,
        city: data.city,
        state: data.state || null,
        postal_code: data.postal_code || null,
        country: data.country,
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Label <span className="text-destructive">*</span></FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="e.g. Main Office, Home"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="col-span-2">
            <form.Field
              name="street_1"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Street Address <span className="text-destructive">*</span></FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="e.g. 123 Main Street"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
          </div>
          <form.Field
            name="building"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Building / Unit</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. Block A, Apt 4B"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="street_2"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Street Line 2</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. Near City Park"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="city"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>City <span className="text-destructive">*</span></FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. Colombo"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="state"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>State / Province</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. Western Province"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="postal_code"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Postal Code</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. 00100"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
          <form.Field
            name="country"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Country <span className="text-destructive">*</span></FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. Sri Lanka"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </div>
      </FieldGroup>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Create Address"}
        </Button>
      </div>
    </form>
  )
}

function CreateGuardianDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const stepRef = useRef(step)
  stepRef.current = step

  const createGuardian = useMutation(createGuardianMutation({ client: apiClient }))

  const form = useForm({
    defaultValues,
    validators: { onSubmit: createGuardianSchema as any },
    onSubmit: async ({ value }) => {
      if (stepRef.current === 1) {
        setStep(2)
        return
      }
      try {
        await createGuardian.mutateAsync({
          body: value,
        })
        queryClient.invalidateQueries({ queryKey: listGuardiansQueryKey({ client: apiClient }) })
        setOpen(false)
        setStep(1)
        form.reset()
        onCreated()
      } catch {
        // silent
      }
    },
  })

  const handleClose = () => { setOpen(false); setStep(1); form.reset() }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep(1); form.reset() }}}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="w-full"><IconPlus className="mr-2 size-4" />Create Guardian</Button>} />
      <DialogContent className="sm:max-w-lg">
        <form
          id="create-guardian-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{step === 1 ? "Guardian Details" : "Enrollment Categories"}</DialogTitle>
          </DialogHeader>



          <FieldGroup>
            {step === 1 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-h-[55vh] overflow-y-auto pr-1">
                <div className="col-span-2">
                  <form.Field
                    name="relationship_type"
                    children={(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Relationship <span className="text-destructive">*</span></FieldLabel>
                          <Select
                            name={field.name}
                            value={field.state.value}
                            onValueChange={(v) => field.handleChange(v ?? "")}
                          >
                            <SelectTrigger id={field.name} aria-invalid={isInvalid} className="w-full">
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_OPTIONS.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldDescription>
                            Guardian&apos;s relationship to the applicant.
                          </FieldDescription>
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      )
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <form.Field
                    name="full_name"
                    children={(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Full Name <span className="text-destructive">*</span></FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="e.g. John Doe"
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      )
                    }}
                  />
                </div>
                <form.Field
                  name="nic_number"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>NIC Number <span className="text-destructive">*</span></FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="e.g. 952312345V"
                        />
                        <FieldDescription>
                          National Identity Card number.
                        </FieldDescription>
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="contact_phone"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="e.g. +94 77 123 4567"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="contact_email"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={String(field.state.value ?? "")}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value || null)}
                          aria-invalid={isInvalid}
                          placeholder="e.g. john@example.com"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="occupation"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Occupation</FieldLabel>
                        <Combobox
                          items={professions}
                          value={String(field.state.value ?? "")}
                          onValueChange={(v) => field.handleChange(v || null)}
                        >
                          <ComboboxInput
                            id={field.name}
                            placeholder="Search or type occupation..."
                            showClear
                            aria-invalid={isInvalid ? true : undefined}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>No matching title. Type your own.</ComboboxEmpty>
                            <ComboboxList>
                              {(item) => (
                                <ComboboxItem key={item} value={item}>
                                  {item}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        <FieldDescription>
                          Current occupation or job title.
                        </FieldDescription>
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
                <div className="col-span-2">
                  <Field>
                    <FieldLabel>Workspace</FieldLabel>
                    <WorkspaceAddressSelect
                      onChange={(name, address) => {
                        form.setFieldValue("workplace_name", name)
                        form.setFieldValue("workplace_address", address)
                      }}
                    />
                    <FieldDescription>
                      Search for an existing workspace address or type a new one.
                    </FieldDescription>
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                <p className="text-xs text-muted-foreground">
                  Select categories that apply to this guardian. These affect enrollment scoring weight.
                </p>
                {CATEGORY_INFO.map((cat) => (
                  <form.Field
                    key={cat.key}
                    name={cat.key}
                    children={(field) => {
                      const checked = field.state.value
                      return (
                        <div
                          className={`rounded-lg border p-3 transition-colors cursor-pointer ${
                            checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                          }`}
                          onClick={(e) => {
                            const target = e.target as HTMLElement
                            if (target.closest('[role="option"], [role="combobox"], [role="listbox"], input, select, button')) return
                            field.handleChange(!checked)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={field.name}
                                name={field.name}
                                checked={checked}
                                onCheckedChange={(v) => field.handleChange(v === true)}
                              />
                              <span className="font-medium text-sm">{cat.label}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">+{cat.weight}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-7">{cat.desc}</p>
                          {cat.key === "is_school_staff" && checked && (
                            <div className="ml-7 mt-2 space-y-2">
                              <form.Field
                                name="staff_school_id"
                                children={(subField: any) => (
                                  <SchoolCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                )}
                              />
                              <form.Field
                                name="staff_type"
                                children={(subField: any) => (
                                  <Select
                                    name={subField.name}
                                    value={String(subField.state.value ?? "")}
                                    onValueChange={(v) => subField.handleChange(v || null)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Staff type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Teacher">Teacher</SelectItem>
                                      <SelectItem value="Admin">Admin</SelectItem>
                                      <SelectItem value="Worker">Worker</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                              <form.Field
                                name="employee_id"
                                children={(subField: any) => (
                                  <Input
                                    placeholder="Employee ID (optional)"
                                    value={String(subField.state.value ?? "")}
                                    onChange={(e) => subField.handleChange(e.target.value || null)}
                                  />
                                )}
                              />
                              <form.Field
                                name="occupation"
                                children={(subField: any) => (
                                  <Input
                                    placeholder="Designation (optional)"
                                    value={String(subField.state.value ?? "")}
                                    onChange={(e) => subField.handleChange(e.target.value || null)}
                                  />
                                )}
                              />
                            </div>
                          )}
                          {cat.key === "is_govt_employee" && checked && (
                            <div className="ml-7 mt-2">
                              <form.Field
                                name="govt_service_years"
                                children={(subField) => (
                                  <Input
                                    placeholder="Years of government service"
                                    type="number"
                                    value={subField.state.value ?? ""}
                                    onChange={(e) => subField.handleChange(e.target.value ? Number(e.target.value) : null)}
                                  />
                                )}
                              />
                            </div>
                          )}
                          {cat.key === "is_past_pupil" && checked && (
                            <div className="ml-7 mt-2 space-y-2">
                              <form.Field
                                name="past_pupil_school_id"
                                children={(subField: any) => (
                                  <SchoolCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                )}
                              />
                              <form.Field
                                name="past_pupil_student_id"
                                children={(subField: any) => (
                                  <StudentCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                )}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <form.Field
                                  name="past_pupil_highest_grade"
                                  children={(subField) => (
                                    <Select
                                      name={subField.name}
                                      value={String(subField.state.value ?? "")}
                                      onValueChange={(v) => subField.handleChange(v || null)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Highest grade" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="GCE_AL">GCE A/L</SelectItem>
                                        <SelectItem value="GCE_OL">GCE O/L</SelectItem>
                                        <SelectItem value="Grade_11">Grade 11</SelectItem>
                                        <SelectItem value="Grade_10">Grade 10</SelectItem>
                                        <SelectItem value="Below_Grade_10">Below Grade 10</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                                <form.Field
                                  name="past_pupil_left_reason"
                                  children={(subField) => (
                                    <Select
                                      name={subField.name}
                                      value={String(subField.state.value ?? "")}
                                      onValueChange={(v) => subField.handleChange(v || null)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Reason" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Transferred">Transferred</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                              </div>
                              <form.Field
                                name="past_pupil_year_left"
                                children={(subField) => (
                                  <Input
                                    placeholder="Year left school (e.g. 2015)"
                                    type="number"
                                    value={subField.state.value ?? ""}
                                    onChange={(e) => subField.handleChange(e.target.value ? Number(e.target.value) : null)}
                                  />
                                )}
                              />
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                ))}
                <form.Field
                  name="income_level"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                        <Field data-invalid={isInvalid}>
                        <FieldLabel>Monthly Income (LKR)</FieldLabel>
                        <Select
                          name={field.name}
                          value={String(field.state.value ?? "")}
                          onValueChange={(v) => (field as any).handleChange(v ?? null)}
                        >
                          <SelectTrigger aria-invalid={isInvalid}>
                            <SelectValue placeholder="Select income range (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="below_25000">Below 25,000</SelectItem>
                            <SelectItem value="25000_50000">25,000 – 50,000</SelectItem>
                            <SelectItem value="50000_100000">50,000 – 100,000</SelectItem>
                            <SelectItem value="100000_200000">100,000 – 200,000</SelectItem>
                            <SelectItem value="200000_500000">200,000 – 500,000</SelectItem>
                            <SelectItem value="above_500000">Above 500,000</SelectItem>
                          </SelectContent>
                        </Select>
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
              </div>
            )}
          </FieldGroup>

          <div className="flex justify-between gap-2 pt-2 border-t">
            <div>
              {step === 2 && (
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>&larr; Back</Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              {step === 1 ? (
                <Button type="submit">Next &rarr;</Button>
              ) : (
                <Button type="submit">Save Guardian</Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditGuardianDialog({ guardian, open, onOpenChange, onSaved }: { guardian: Guardian; open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [step, setStep] = useState(1)

  const updateGuardian = useMutation(updateGuardianMutation({ client: apiClient }))

  const form = useForm({
    defaultValues: {
      full_name: guardian.full_name,
      nic_number: guardian.nic_number,
      contact_phone: guardian.contact_phone,
      contact_email: guardian.contact_email ?? null,
      occupation: guardian.occupation ?? null,
      workplace_name: guardian.workplace_name ?? null,
      workplace_address: guardian.workplace_address ?? null,
      relationship_type: guardian.relationship_type,
      is_school_staff: guardian.is_school_staff,
      staff_type: null,
      employee_id: null,
      staff_school_id: null,
      is_past_pupil: guardian.is_past_pupil,
      is_govt_employee: guardian.is_govt_employee,
      income_level: guardian.income_level ?? null,
      govt_service_years: guardian.govt_service_years ?? null,
      past_pupil_student_id: null,
      past_pupil_highest_grade: null,
      past_pupil_year_left: null,
      past_pupil_left_reason: null,
      past_pupil_school_id: null,
    },
    validators: { onSubmit: createGuardianSchema as any },
    onSubmit: async ({ value }) => {
      try {
        setEditing(true)
        const { id: _gi, created_at: _gc, past_pupil_verified: _gp, ...guardianBase } = guardian
        await updateGuardian.mutateAsync({
          path: { id: guardian.id },
          body: {
            ...guardianBase,
            full_name: value.full_name,
            nic_number: value.nic_number,
            contact_phone: value.contact_phone ?? "0",
            contact_email: value.contact_email ?? null,
            occupation: value.occupation ?? null,
            workplace_name: value.workplace_name ?? null,
            workplace_address: value.workplace_address ?? null,
            relationship_type: value.relationship_type,
            is_school_staff: value.is_school_staff,
            staff_type: value.staff_type ?? null,
            employee_id: value.employee_id ?? null,
            staff_school_id: value.staff_school_id ?? null,
            is_past_pupil: value.is_past_pupil,
            is_govt_employee: value.is_govt_employee,
            income_level: value.income_level ?? null,
            govt_service_years: value.govt_service_years ?? null,
            past_pupil_student_id: value.past_pupil_student_id ?? null,
            past_pupil_highest_grade: value.past_pupil_highest_grade ?? null,
            past_pupil_year_left: value.past_pupil_year_left ?? null,
            past_pupil_left_reason: value.past_pupil_left_reason ?? null,
            past_pupil_school_id: value.past_pupil_school_id ?? null,
          },
        })
        queryClient.invalidateQueries({ queryKey: listGuardiansQueryKey({ client: apiClient }) })
        onOpenChange(false)
        setStep(1)
        form.reset()
        onSaved()
      } catch {
        // silent
      } finally {
        setEditing(false)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setStep(1); form.reset() }}}>
      <DialogContent className="sm:max-w-lg">
        <form
          id="edit-guardian-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (step === 2) {
              form.handleSubmit()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{step === 1 ? "Edit Guardian" : "Enrollment Categories"}</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <div className={step === 1 ? "block" : "hidden"}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-h-[55vh] overflow-y-auto pr-1">
                <div className="col-span-2">
                  <form.Field
                    name="relationship_type"
                    children={(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Relationship <span className="text-destructive">*</span></FieldLabel>
                          <Select
                            name={field.name}
                            value={field.state.value}
                            onValueChange={(v) => field.handleChange(v ?? "")}
                          >
                            <SelectTrigger id={field.name} aria-invalid={isInvalid} className="w-full">
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              {RELATIONSHIP_OPTIONS.map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldDescription>Guardian&apos;s relationship to the applicant.</FieldDescription>
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      )
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <form.Field
                    name="full_name"
                    children={(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Full Name <span className="text-destructive">*</span></FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="e.g. John Doe"
                          />
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      )
                    }}
                  />
                </div>
                <form.Field
                  name="nic_number"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>NIC Number <span className="text-destructive">*</span></FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="e.g. 952312345V"
                        />
                        <FieldDescription>National Identity Card number.</FieldDescription>
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="contact_phone"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="e.g. +94 77 123 4567"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="contact_email"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={String(field.state.value ?? "")}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value || null)}
                          aria-invalid={isInvalid}
                          placeholder="e.g. john@example.com"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
                <form.Field
                  name="occupation"
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Occupation</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={String(field.state.value ?? "")}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value || null)}
                          aria-invalid={isInvalid}
                          placeholder="e.g. Teacher"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                  />
              </div>
            </div>

            <div className={step === 2 ? "block" : "hidden"}>
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                <p className="text-xs text-muted-foreground">
                  Select categories that apply to this guardian. These affect enrollment scoring weight.
                </p>
                {CATEGORY_INFO.map((cat) => (
                  <form.Field
                    key={cat.key}
                    name={cat.key}
                    children={(field: any) => {
                      const checked = field.state.value
                      return (
                        <div
                          className={`rounded-lg border p-3 transition-colors cursor-pointer ${
                            checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                          }`}
                          onClick={(e) => {
                            const target = e.target as HTMLElement
                            if (target.closest('[role="option"], [role="combobox"], [role="listbox"], input, select, button')) return
                            field.handleChange(!checked)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={field.name}
                                name={field.name}
                                checked={checked}
                                onCheckedChange={(v) => field.handleChange(v === true)}
                              />
                              <span className="font-medium text-sm">{cat.label}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">+{cat.weight}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-7">{cat.desc}</p>
                          {cat.key === "is_school_staff" && checked && (
                            <div className="ml-7 mt-2 space-y-2">
                              {(form as any).Field({
                                name: "staff_school_id",
                                children: (subField: any) => (
                                  <SchoolCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                )
                              })}
                              {(form as any).Field({
                                name: "staff_type",
                                children: (subField: any) => (
                                  <Select
                                    name={subField.name}
                                    value={String(subField.state.value ?? "")}
                                    onValueChange={(v) => subField.handleChange(v || null)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Staff type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Teacher">Teacher</SelectItem>
                                      <SelectItem value="Admin">Admin</SelectItem>
                                      <SelectItem value="Worker">Worker</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )
                              })}
                              {(form as any).Field({
                                name: "employee_id",
                                children: (subField: any) => (
                                  <Input
                                    placeholder="Employee ID (optional)"
                                    value={String(subField.state.value ?? "")}
                                    onChange={(e) => subField.handleChange(e.target.value || null)}
                                  />
                                )
                              })}
                              {(form as any).Field({
                                name: "occupation",
                                children: (subField: any) => (
                                  <Input
                                    placeholder="Designation (optional)"
                                    value={String(subField.state.value ?? "")}
                                    onChange={(e) => subField.handleChange(e.target.value || null)}
                                  />
                                )
                              })}
                            </div>
                          )}
                          {cat.key === "is_govt_employee" && checked && (
                            <div className="ml-7 mt-2">
                              <form.Field
                                name="govt_service_years"
                                children={(subField: any) => (
                                  <Input
                                    placeholder="Years of government service"
                                    type="number"
                                    value={subField.state.value ?? ""}
                                    onChange={(e) => subField.handleChange(e.target.value ? Number(e.target.value) : null)}
                                  />
                                )}
                              />
                            </div>
                          )}
                          {cat.key === "is_past_pupil" && checked && (
                            <div className="ml-7 mt-2 space-y-2">
                              {(form as any).Field({
                                name: "past_pupil_school_id",
                                children: (subField: any) => (
                                  <SchoolCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                )
                              })}
                              {(form as any).Field({
                                name: "past_pupil_student_id",
                                children: (subField: any) => (
                                  <StudentCombobox
                                    value={subField.state.value}
                                    onChange={(v) => subField.handleChange(v)}
                                  />
                                )
                              })}
                              <div className="grid grid-cols-2 gap-2">
                                {(form as any).Field({
                                  name: "past_pupil_highest_grade",
                                  children: (subField: any) => (
                                    <Select
                                      name={subField.name}
                                      value={String(subField.state.value ?? "")}
                                      onValueChange={(v) => subField.handleChange(v || null)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Highest grade" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="GCE_AL">GCE A/L</SelectItem>
                                        <SelectItem value="GCE_OL">GCE O/L</SelectItem>
                                        <SelectItem value="Grade_11">Grade 11</SelectItem>
                                        <SelectItem value="Grade_10">Grade 10</SelectItem>
                                        <SelectItem value="Below_Grade_10">Below Grade 10</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )
                                })}
                                {(form as any).Field({
                                  name: "past_pupil_left_reason",
                                  children: (subField: any) => (
                                    <Select
                                      name={subField.name}
                                      value={String(subField.state.value ?? "")}
                                      onValueChange={(v) => subField.handleChange(v || null)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Reason" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Transferred">Transferred</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )
                                })}
                              </div>
                              {(form as any).Field({
                                name: "past_pupil_year_left",
                                children: (subField: any) => (
                                  <Input
                                    placeholder="Year left school (e.g. 2015)"
                                    type="number"
                                    value={subField.state.value ?? ""}
                                    onChange={(e) => subField.handleChange(e.target.value ? Number(e.target.value) : null)}
                                  />
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                ))}
                <form.Field
                  name="income_level"
                  children={(field: any) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel>Monthly Income (LKR)</FieldLabel>
                        <Select
                          name={field.name}
                          value={String(field.state.value ?? "")}
                          onValueChange={(v) => field.handleChange(v ?? null)}
                        >
                          <SelectTrigger aria-invalid={isInvalid}>
                            <SelectValue placeholder="Select income range (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="below_25000">Below 25,000</SelectItem>
                            <SelectItem value="25000_50000">25,000 – 50,000</SelectItem>
                            <SelectItem value="50000_100000">50,000 – 100,000</SelectItem>
                            <SelectItem value="100000_200000">100,000 – 200,000</SelectItem>
                            <SelectItem value="200000_500000">200,000 – 500,000</SelectItem>
                            <SelectItem value="above_500000">Above 500,000</SelectItem>
                          </SelectContent>
                        </Select>
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
              </div>
            </div>
          </FieldGroup>

          <div className="flex justify-between gap-2 pt-4 border-t">
            <div>
              {step === 2 && (
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                  <IconChevronLeft className="size-4 mr-1" /> Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => { onOpenChange(false); setStep(1); form.reset() }}>
                Cancel
              </Button>
              {step === 1 ? (
                <Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStep(2) }}>Next <IconChevronRight className="size-4 ml-1" /></Button>
              ) : (
                <Button type="submit" disabled={editing}>
                  {editing ? "Saving..." : "Save Guardian"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PastPupilBadge({ guardianId }: { guardianId: string }) {
  const { data: ppDetails } = useQuery({
    ...listPastPupilDetailsOptions({ client: apiClient, query: { guardian_id: guardianId } }),
    enabled: !!guardianId,
  })
  const detail = Array.isArray(ppDetails) ? ppDetails[0] : undefined
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium gap-1 ${getEnumStyle("guardian_flag", "past_pupil") ?? ""}`}>
      <span>Alumni</span>
      {detail?.highest_grade && <span className="text-muted-foreground/60">{detail.highest_grade.replace(/_/g, ' ')}</span>}
      {detail?.year_left && <span className="text-muted-foreground/60">{detail.year_left}</span>}
      {detail?.student_id && <span className="text-muted-foreground/60">#{detail.student_id}</span>}
    </span>
  )
}

function StaffBadge({ guardianId }: { guardianId: string }) {
  const { data: staffDetails } = useQuery({
    ...listStaffDetailsOptions({ client: apiClient, query: { guardian_id: guardianId } }),
    enabled: !!guardianId,
  })
  const detail = Array.isArray(staffDetails) ? staffDetails[0] : undefined
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium gap-1 ${getEnumStyle("guardian_flag", "staff") ?? ""}`}>
      <span>Staff</span>
      {detail?.staff_type && (
        <span className={`inline-flex items-center rounded-sm border px-0.5 py-0 text-[9px] font-medium ${getEnumStyle("staff_type", detail.staff_type) ?? ""}`}>
          {getEnumLabel("staff_type", detail.staff_type)}
        </span>
      )}
      {detail?.employee_id && <span className="text-muted-foreground/60">#{detail.employee_id}</span>}
    </span>
  )
}

function StudentCombobox({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data: students = [] } = useQuery({
    ...listStudentsOptions({ client: apiClient, query: { search: debouncedSearch || undefined } }),
    enabled: open,
  })

  const selected = students.find((s: any) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {selected ? `${selected.full_name}${selected.admission_number ? ` #${selected.admission_number}` : ''}` : 'Search student...'}
          <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      } />
      <PopoverContent className="w-[--anchor-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search by name or ID..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No students found.</CommandEmpty>
            <CommandGroup>
              {students.map((s) => (
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
                    {s.admission_number && <span className="text-xs text-muted-foreground">#{s.admission_number}</span>}
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

interface Props {
  selectedIds: string[]
  onSelect: (id: string) => void
  onDeselect: (id: string) => void
}

interface SchoolOption {
  id: string
  name_si: string
  name_en: string | null
}

function SchoolCombobox({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const { data: schools = [] } = useQuery({
    queryKey: ["list-schools", debouncedSearch],
    queryFn: async () => {
      const res = await apiClient.get({ url: "/api/schools", query: { search: debouncedSearch || undefined } })
      if (res.error) {
        console.error("School list error:", res.error)
        return []
      }
      return (res.data ?? []) as SchoolOption[]
    },
    enabled: open,
  })

  const selected = schools.find((s) => s.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {selected ? `${selected.name_si}${selected.name_en ? ` · ${selected.name_en}` : ''}` : 'Search school...'}
          <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      } />
      <PopoverContent className="w-[--anchor-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search by school name..." value={search} onValueChange={setSearch} />
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
                    {s.name_en && <span className="text-xs text-muted-foreground">{s.name_en}</span>}
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

export function GuardianSelector({ selectedIds, onSelect, onDeselect }: Props) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [editTarget, setEditTarget] = useState<Guardian | null>(null)

  const { data: guardians } = useQuery(listGuardiansOptions({ client: apiClient }))

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

  const handlePageChange = (p: number) => {
    setPage(Math.max(0, Math.min(p, totalPages - 1)))
  }

  const handleCreated = useCallback(() => {
    setPage(0)
  }, [])

  return (
    <div className="space-y-3">
      <div className="relative">
        <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, NIC, phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="pl-8"
        />
      </div>

      <CreateGuardianDialog onCreated={handleCreated} />

      <ScrollArea className="h-[360px] pr-2">
        <div className="space-y-1">
          {paged.map((g) => {
            const isSelected = selectedIds.includes(g.id)
            return (
              <HoverCard key={g.id}>
                <HoverCardTrigger>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => isSelected ? onDeselect(g.id) : onSelect(g.id)}
                    onKeyDown={(e) => { if (e.key === "Enter") isSelected ? onDeselect(g.id) : onSelect(g.id) }}
                    className={cn(
                      "w-full flex items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent cursor-pointer group",
                      isSelected ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <IconUser className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{g.full_name}</p>
                      <p className="text-xs text-muted-foreground">{g.relationship_type} &middot; {g.nic_number}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                        <span>{g.contact_phone}</span>
                        {g.contact_email && <span className="truncate">{g.contact_email}</span>}
                        {g.occupation && <span>{g.occupation}</span>}
                        {g.workplace_name && <span>{g.workplace_name}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {g.is_school_staff && <StaffBadge guardianId={g.id} />}
                        {g.is_past_pupil && <PastPupilBadge guardianId={g.id} />}
                        {g.is_govt_employee && <span className={`inline-flex items-center rounded-sm border px-1 py-0 text-[10px] font-medium ${getEnumStyle("guardian_flag", "govt") ?? ""}`}>Govt</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setEditTarget(g) }}
                      className="size-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent-foreground/10 transition-opacity shrink-0"
                      aria-label="Edit guardian"
                    >
                      <IconPencil className="size-3.5 text-muted-foreground" />
                    </button>
                    {isSelected && (
                      <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <IconCheck className="size-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="right" align="start" sideOffset={8} className="p-3">
                  <GuardianProfileCard g={g} />
                </HoverCardContent>
              </HoverCard>
            )
          })}
          {paged.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No guardians found</p>
          )}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" disabled={safePage === 0} onClick={() => handlePageChange(safePage - 1)}>
            <IconChevronLeft className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {safePage + 1} / {totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={safePage >= totalPages - 1} onClick={() => handlePageChange(safePage + 1)}>
            <IconChevronRight className="size-4" />
          </Button>
        </div>
      )}
      {editTarget && (
        <EditGuardianDialog
          guardian={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null) }}
          onSaved={() => { setEditTarget(null); queryClient.invalidateQueries({ queryKey: listGuardiansQueryKey({ client: apiClient }) }) }}
        />
      )}
    </div>
  )
}
