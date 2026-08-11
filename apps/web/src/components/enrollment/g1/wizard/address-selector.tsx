"use client"

import { useState, useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiClient } from "@/lib/api-client"
import {
  listAddressesOptions,
  listAddressesQueryKey,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { createAddress } from "@/lib/api-client/sdk.gen"
import { queryClient } from "@/router"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { cn } from "@/lib/utils"
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconSearch,
  IconCheck,
  IconMapPin,
} from "@tabler/icons-react"
import { useDebounce } from "@/hooks/use-debounce"
import { EntityDialog } from "@/lib/form-builder"
import {
  addressFormConfig,
  addressFormDefaults,
} from "@/components/forms/address-form"
import type { AddressFormValues } from "@/components/forms/address-form"

const PAGE_SIZE = 8

export type AddressEntryValue = {
  address_id: string
  address_type: string
  residence_type: string
  is_primary: boolean
}

function CreateAddressDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)

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
      <EntityDialog<AddressFormValues>
        open={open}
        onOpenChange={setOpen}
        title="New Address"
        config={addressFormConfig}
        defaultValues={addressFormDefaults}
        onSubmit={async (values) => {
          try {
            await createAddress({
              body: values,
              client: apiClient,
              throwOnError: true,
            })
            queryClient.invalidateQueries({
              queryKey: listAddressesQueryKey({ client: apiClient }),
            })
            toast.success(`${values.address_line_1} created`)
            onCreated()
            setOpen(false)
          } catch (err) {
            toastApiError(err, "Failed to create address")
          }
        }}
        actionLabel="Create Address"
        size="md"
      />
    </>
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
                    {addr.address_line_2 ||
                      `${addr.district}, ${addr.province}`}
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
