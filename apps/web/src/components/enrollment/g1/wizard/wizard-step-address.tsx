"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { toastApiError } from "@/lib/api-error"
import { listAddressesOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import type { Address } from "@/lib/api-client/types.gen"
import {
  IconLoader2,
  IconCheck,
  IconMapPin,
  IconX,
  IconFile,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { OwnershipProofDialog } from "./ownership-proof-dialog"
import type { OwnershipProofEntry } from "./ownership-proof-dialog"

export type AddressEntryValue = {
  address_id: string
  address_type: string
  residence_type: string
  is_primary: boolean
  ownership_proof?: string
  ownership_proof_url?: string
  ownership_proofs?: OwnershipProofEntry[]
}

interface Props {
  selectedAddresses: AddressEntryValue[]
  onUpdate: (
    id: string,
    field: keyof AddressEntryValue,
    value: string | boolean
  ) => void
  onDeselect: (id: string) => void
  onSave: (addresses: AddressEntryValue[]) => Promise<void>
  onBack: () => void
  onNext: () => void
}

const ADDRESS_TYPE_OPTIONS = ["Permanent", "Temporary"] as const
const RESIDENCE_TYPE_OPTIONS = ["Owned", "Rented", "Relative", "Other"] as const

const FILTERS = [
  { key: "all", label: "All" },
  { key: "Permanent", label: "Permanent" },
  { key: "Temporary", label: "Temporary" },
] as const

export function WizardStepAddress({
  selectedAddresses,
  onUpdate,
  onDeselect,
  onSave,
  onBack,
  onNext,
}: Props) {
  const [filter, setFilter] = useState<string>("all")
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")
  const [proofDialogAddressId, setProofDialogAddressId] = useState<
    string | null
  >(null)
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  const { data: addresses = [] } = useQuery(
    listAddressesOptions({ client: apiClient })
  )

  const addressMap = useMemo(() => {
    const m = new Map<string, Address>()
    for (const a of addresses) m.set(a.id, a)
    return m
  }, [addresses])

  const displayAddresses = useMemo(() => {
    let items = selectedAddresses
    if (filter !== "all") {
      items = items.filter((a) => a.address_type === filter)
    }
    return items
  }, [selectedAddresses, filter])

  const updatePrimary = (id: string) => {
    for (const a of selectedAddresses) {
      onUpdate(a.address_id, "is_primary", a.address_id === id)
    }
  }

  const handleNext = async () => {
    setStatus("saving")
    try {
      await onSave(selectedAddresses)
      setStatus("done")
      navigateTimer.current = setTimeout(() => onNext(), 400)
    } catch (e) {
      console.error("onSave failed:", e)
      setStatus("idle")
      toastApiError(e, "Failed to save. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Addresses ({selectedAddresses.length})</CardTitle>
        <CardDescription>
          Review and manage addresses assigned to this child.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <Badge
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Badge>
          ))}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-2 gap-3">
            {displayAddresses.map((entry) => {
              const addr = addressMap.get(entry.address_id)
              if (!addr) return null
              return (
                <div
                  key={entry.address_id}
                  className={cn(
                    "relative space-y-2 rounded-lg border p-3",
                    entry.is_primary && "border-primary/50 bg-primary/5"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDeselect(entry.address_id)}
                    aria-label={`Remove address`}
                    className="absolute top-1.5 right-1.5 size-6"
                  >
                    <IconX className="size-3.5" />
                  </Button>

                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <IconMapPin className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {addr.address_line_1}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {addr.address_line_2 ||
                          `${addr.district}, ${addr.province}`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <IconMapPin className="size-3 shrink-0" />
                      <span>
                        {addr.city}
                        {addr.postal_code ? `, ${addr.postal_code}` : ""}
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t pt-1">
                    <Select
                      value={entry.address_type}
                      onValueChange={(val) =>
                        val && onUpdate(entry.address_id, "address_type", val)
                      }
                    >
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ADDRESS_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={entry.residence_type}
                      onValueChange={(val) =>
                        val && onUpdate(entry.address_id, "residence_type", val)
                      }
                    >
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue placeholder="Residence" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESIDENCE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => setProofDialogAddressId(entry.address_id)}
                    >
                      {entry.ownership_proofs &&
                      entry.ownership_proofs.length > 0 ? (
                        <>
                          <IconFile className="size-3" />
                          Proofs ({entry.ownership_proofs.length})
                        </>
                      ) : (
                        "Upload Proof"
                      )}
                    </Button>

                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="radio"
                        name={`primary-address-${entry.address_id}`}
                        checked={entry.is_primary}
                        onChange={() => updatePrimary(entry.address_id)}
                        className="size-3.5 accent-primary"
                      />
                      <span className="text-xs text-muted-foreground">
                        Primary address
                      </span>
                      {entry.is_primary && (
                        <Badge
                          variant="default"
                          className="ml-auto h-4 px-1 py-0 text-[10px]"
                        >
                          Primary
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {displayAddresses.length === 0 && (
              <div className="col-span-2">
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {selectedAddresses.length === 0
                    ? "No addresses selected yet. Browse the directory on the left."
                    : "No addresses match the current filter."}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={status !== "idle" || selectedAddresses.length === 0}
          >
            {status === "saving" && (
              <IconLoader2 className="mr-1.5 size-4 animate-spin" />
            )}
            {status === "done" && (
              <IconCheck className="mr-1.5 size-4 text-green-600" />
            )}
            {status === "idle"
              ? "Next"
              : status === "saving"
                ? "Saving\u2026"
                : "Saved"}
          </Button>
        </div>
      </CardContent>

      {proofDialogAddressId && (
        <OwnershipProofDialog
          open={!!proofDialogAddressId}
          onOpenChange={(open) => {
            if (!open) setProofDialogAddressId(null)
          }}
          addressId={proofDialogAddressId}
          existingProofs={
            selectedAddresses.find((a) => a.address_id === proofDialogAddressId)
              ?.ownership_proofs ?? []
          }
          onSave={(proofs) => {
            onUpdate(
              proofDialogAddressId,
              "ownership_proofs",
              proofs as unknown as string | boolean
            )
            setProofDialogAddressId(null)
          }}
        />
      )}
    </Card>
  )
}
