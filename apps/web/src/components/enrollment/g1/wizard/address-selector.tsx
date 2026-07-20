"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { apiClient } from "@/lib/api-client"
import { listWorkspaceAddressesOptions, createWorkspaceAddressMutation, listWorkspaceAddressesQueryKey } from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import { cn } from "@/lib/utils"
import { IconChevronLeft, IconChevronRight, IconPlus, IconSearch, IconCheck, IconBuilding, IconMapPin } from "@tabler/icons-react"
import type { CreateWorkspaceAddressBody } from "@/lib/api-client/types.gen"

const PAGE_SIZE = 8

export type AddressEntryValue = {
  workspace_address_id: string
  address_type: string
  residence_type: string
  is_primary: boolean
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

const addressFormDefaults: CreateWorkspaceAddressBody = {
  name: "",
  building: null,
  street_1: "",
  street_2: null,
  city: "Galle",
  state: null,
  postal_code: null,
  country: "Sri Lanka",
}

function CreateAddressDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

  const createMutation = useMutation({
    ...createWorkspaceAddressMutation({ client: apiClient }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listWorkspaceAddressesQueryKey({ client: apiClient }) })
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
        <IconPlus className="size-4 mr-1.5" />
        Create Address
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Address</DialogTitle>
          </DialogHeader>
          <CreateAddressForm
            onSubmit={(data) => createMutation.mutate({ body: data, client: apiClient })}
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
  onSubmit: (data: CreateWorkspaceAddressBody) => void
  onCancel: () => void
  isPending: boolean
}) {
  const form = useForm({
    defaultValues: addressFormDefaults,
    onSubmit: async ({ value }) => {
      onSubmit({
        name: value.name,
        building: value.building || null,
        street_1: value.street_1,
        street_2: value.street_2 || null,
        city: value.city,
        state: value.state || null,
        postal_code: value.postal_code || null,
        country: value.country,
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
                  placeholder="e.g. Home, Office, Rental"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
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
        <div className="grid grid-cols-2 gap-3">
          <form.Field
            name="building"
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Building</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value || null)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. Block A"
                  />
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
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value || null)}
                    aria-invalid={isInvalid}
                    placeholder="e.g. Near park"
                  />
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
                  />
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

interface AddressSelectorProps {
  selectedIds: string[]
  onSelect: (id: string) => void
  onDeselect: (id: string) => void
}

export function AddressSelector({ selectedIds, onSelect, onDeselect }: AddressSelectorProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
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
        <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, street, city..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
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
                onClick={() => isSelected ? onDeselect(addr.id) : onSelect(addr.id)}
                onKeyDown={(e) => { if (e.key === "Enter") isSelected ? onDeselect(addr.id) : onSelect(addr.id) }}
                className={cn(
                  "w-full flex items-start gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent cursor-pointer group",
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <IconBuilding className="size-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{addr.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{addr.full_address}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <IconMapPin className="size-3 shrink-0" />
                    <span>{addr.city}{addr.state ? `, ${addr.state}` : ""}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="size-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <IconCheck className="size-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            )
          })}
          {paged.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? "No addresses found" : "No addresses yet. Create one to get started."}
            </p>
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
    </div>
  )
}
