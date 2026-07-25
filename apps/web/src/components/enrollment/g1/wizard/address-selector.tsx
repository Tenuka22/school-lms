"use client"

import { useState, useCallback, useMemo } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { apiClient } from "@/lib/api-client"
import {
  listAddressesOptions,
  createAddressMutation,
  listAddressesQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import { cn } from "@/lib/utils"
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconSearch,
  IconCheck,
  IconMapPin,
} from "@tabler/icons-react"
import type { CreateAddressBody } from "@/lib/api-client/types.gen"
import { useDebounce } from "@/hooks/use-debounce"

const PAGE_SIZE = 8

export type AddressEntryValue = {
  address_id: string
  address_type: string
  residence_type: string
  is_primary: boolean
}

const addressFormDefaults: CreateAddressBody = {
  address_line_1: "",
  address_line_2: null,
  city: "Galle",
  district: "Galle",
  province: "Southern",
  gs_division: "",
  postal_code: null,
  latitude: null,
  longitude: null,
  distance_to_school_km: null,
  verified_by_map: false,
  residence_type: null,
  ownership_proof: null,
}

function CreateAddressDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

  const createMutation = useMutation({
    ...createAddressMutation({ client: apiClient }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: listAddressesQueryKey({ client: apiClient }),
      })
      onCreated()
      setOpen(false)
    },
  })

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <IconPlus className="mr-1.5 size-4" />
        Create Address
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Address</DialogTitle>
          </DialogHeader>
          <CreateAddressForm
            onSubmit={(data) =>
              createMutation.mutate({ body: data, client: apiClient })
            }
            onCancel={() => setOpen(false)}
            isPending={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

function CreateAddressForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (data: CreateAddressBody) => void
  onCancel: () => void
  isPending: boolean
}) {
  const form = useForm({
    defaultValues: addressFormDefaults,
    onSubmit: async ({ value }) => {
      onSubmit({
        address_line_1: value.address_line_1,
        address_line_2: value.address_line_2 || null,
        city: value.city,
        district: value.district,
        province: value.province,
        gs_division: value.gs_division,
        postal_code: value.postal_code || null,
        latitude: value.latitude ?? null,
        longitude: value.longitude ?? null,
        distance_to_school_km: value.distance_to_school_km ?? null,
        verified_by_map: value.verified_by_map,
        residence_type: value.residence_type || null,
        ownership_proof: value.ownership_proof || null,
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
          name="address_line_1"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Address Line 1 <span className="text-destructive">*</span>
                </FieldLabel>
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
        <form.Field
          name="address_line_2"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Address Line 2</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value || null)}
                  aria-invalid={isInvalid}
                  placeholder="e.g. Apt 4B"
                />
              </Field>
            )
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <form.Field
            name="city"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    City <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                </Field>
              )
            }}
          />
          <form.Field
            name="district"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    District <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                </Field>
              )
            }}
          />
          <form.Field
            name="province"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Province <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                </Field>
              )
            }}
          />
          <form.Field
            name="gs_division"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    GS Division <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                </Field>
              )
            }}
          />
          <form.Field
            name="postal_code"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Postal Code</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value || null)}
                    aria-invalid={isInvalid}
                  />
                </Field>
              )
            }}
          />
        </div>
      </FieldGroup>
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Create Address"}
        </Button>
      </div>
    </form>
  )
}

interface AddressSelectorProps {
  selectedIds: string[]
  onSelect: (id: string) => void
  onDeselect: (id: string) => void
}

export function AddressSelector({
  selectedIds,
  onSelect,
  onDeselect,
}: AddressSelectorProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const debouncedSearch = useDebounce(search, 300)

  const { data: addresses = [] } = useQuery(
    listAddressesOptions({
      client: apiClient,
      query: { search: debouncedSearch || undefined },
    })
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return addresses
    const q = search.toLowerCase()
    return addresses.filter(
      (a) =>
        a.address_line_1.toLowerCase().includes(q) ||
        (a.address_line_2 && a.address_line_2.toLowerCase().includes(q)) ||
        a.city.toLowerCase().includes(q) ||
        a.district.toLowerCase().includes(q) ||
        a.province.toLowerCase().includes(q) ||
        (a.postal_code && a.postal_code.toLowerCase().includes(q))
    )
  }, [addresses, search])

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
        <IconSearch className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, street, city..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className="pl-9"
        />
      </div>

      <CreateAddressDialog onCreated={handleCreated} />

      <ScrollArea className="h-[360px] pr-2">
        <div className="space-y-1">
          {paged.map((addr) => {
            const isSelected = selectedIds.includes(addr.id)
            return (
              <div
                key={addr.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  isSelected ? onDeselect(addr.id) : onSelect(addr.id)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    isSelected ? onDeselect(addr.id) : onSelect(addr.id)
                }}
                className={cn(
                  "group flex w-full cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent",
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <IconMapPin className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{addr.address_line_1}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {addr.address_line_2 || `${addr.district}, ${addr.province}`}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <IconMapPin className="size-3 shrink-0" />
                    <span>
                      {addr.city}
                      {addr.postal_code ? `, ${addr.postal_code}` : ""}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary">
                    <IconCheck className="size-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            )
          })}
          {paged.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search
                ? "No addresses found"
                : "No addresses yet. Create one to get started."}
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
    </div>
  )
}
