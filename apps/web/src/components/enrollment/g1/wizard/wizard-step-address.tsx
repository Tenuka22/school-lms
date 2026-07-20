"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { listWorkspaceAddressesOptions } from "@/lib/api-client/@tanstack/react-query.gen"
import type { WorkspaceAddress } from "@/lib/api-client/types.gen"
import { IconLoader2, IconCheck, IconBuilding, IconMapPin, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export type AddressEntryValue = {
  workspace_address_id: string
  address_type: string
  residence_type: string
  is_primary: boolean
}

interface Props {
  selectedAddresses: AddressEntryValue[]
  onUpdate: (id: string, field: keyof AddressEntryValue, value: string | boolean) => void
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

export function WizardStepAddress({ selectedAddresses, onUpdate, onDeselect, onSave, onBack, onNext }: Props) {
  const [filter, setFilter] = useState<string>("all")
  const [status, setStatus] = useState<"idle" | "saving" | "done">("idle")
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  const { data: addresses = [] } = useQuery(listWorkspaceAddressesOptions({ client: apiClient }))
  const addressMap = useMemo(() => {
    const m = new Map<string, WorkspaceAddress>()
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
      onUpdate(a.workspace_address_id, "is_primary", a.workspace_address_id === id)
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
      toast.error("Failed to save. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Addresses ({selectedAddresses.length})</CardTitle>
        <CardDescription>Review and manage addresses assigned to this child.</CardDescription>
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
              const addr = addressMap.get(entry.workspace_address_id)
              if (!addr) return null
              return (
                <div
                  key={entry.workspace_address_id}
                  className={cn(
                    "relative rounded-lg border p-3 space-y-2",
                    entry.is_primary && "border-primary/50 bg-primary/5"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDeselect(entry.workspace_address_id)}
                    aria-label={`Remove ${addr.name}`}
                    className="absolute top-1.5 right-1.5 size-6"
                  >
                    <IconX className="size-3.5" />
                  </Button>

                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <IconBuilding className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{addr.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{addr.full_address}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <IconMapPin className="size-3 shrink-0" />
                      <span>{addr.city}{addr.state ? `, ${addr.state}` : ""}{addr.postal_code ? ` - ${addr.postal_code}` : ""}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                    <Select
                      value={entry.address_type}
                      onValueChange={(val) => val && onUpdate(entry.workspace_address_id, "address_type", val)}
                    >
                      <SelectTrigger className="w-full h-7 text-xs">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ADDRESS_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={entry.residence_type}
                      onValueChange={(val) => val && onUpdate(entry.workspace_address_id, "residence_type", val)}
                    >
                      <SelectTrigger className="w-full h-7 text-xs">
                        <SelectValue placeholder="Residence" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESIDENCE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="radio"
                        name="primary-address"
                        checked={entry.is_primary}
                        onChange={() => updatePrimary(entry.workspace_address_id)}
                        className="size-3.5 accent-primary"
                      />
                      <span className="text-xs text-muted-foreground">Primary address</span>
                      {entry.is_primary && (
                        <Badge variant="default" className="text-[10px] px-1 py-0 h-4 ml-auto">Primary</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {displayAddresses.length === 0 && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground text-center py-12">
                  {selectedAddresses.length === 0
                    ? "No addresses selected yet. Browse the directory on the left."
                    : "No addresses match the current filter."}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={handleNext} disabled={status !== "idle" || selectedAddresses.length === 0}>
            {status === "saving" && <IconLoader2 className="size-4 mr-1.5 animate-spin" />}
            {status === "done" && <IconCheck className="size-4 mr-1.5 text-green-600" />}
            {status === "idle" ? "Next" : status === "saving" ? "Saving\u2026" : "Saved"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
