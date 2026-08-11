"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { IconChevronDown, IconLoader2, IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export type GnDivision = {
  id: string
  name_local: string
  name_en: string
  slug: string
  parent_id: string
  parent_name_en: string
  parent_name_local: string
  postal_code: string | null
}

interface Props {
  value?: string
  onValueChange: (name: string, number: string) => void
  placeholder?: string
  disabled?: boolean
}

export function GnDivisionSelect({
  value,
  onValueChange,
  placeholder = "Search GN division...",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const {
    data: gnDivisions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["gn-divisions"],
    queryFn: async () => {
      const res = await apiClient.get({ url: "/api/gn-divisions" })
      if (res.error) {
        console.error("GN divisions error:", res.error)
        return []
      }
      return (res.data ?? []) as GnDivision[]
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: open,
  })

  const filtered = useMemo(() => {
    if (!gnDivisions) return []
    if (!search.trim()) return gnDivisions.slice(0, 50)
    const q = search.toLowerCase()
    return gnDivisions
      .filter(
        (g) =>
          g.name_en.toLowerCase().includes(q) ||
          g.name_local.includes(q) ||
          g.parent_name_en.toLowerCase().includes(q) ||
          g.id.toLowerCase().includes(q)
      )
      .slice(0, 50)
  }, [gnDivisions, search])

  const getGnNumber = (id: string) => id.slice(-3)

  const selected = gnDivisions?.find(
    (g) => `${g.name_en}-${getGnNumber(g.id)}` === value
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            {selected ? (
              <span>
                {selected.name_en} ({getGnNumber(selected.id)})
              </span>
            ) : (
              placeholder
            )}
            <IconChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by GN name, DS division, or postal code..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2 py-4">
                  <IconLoader2 className="size-4 animate-spin" />
                  Loading GN divisions...
                </span>
              ) : error ? (
                <span className="py-4 text-center text-sm text-destructive">
                  Failed to load. Try again.
                </span>
              ) : (
                "No GN division found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((g) => {
                const gnNumber = getGnNumber(g.id)
                const isSelected = `${g.name_en}-${gnNumber}` === value
                return (
                  <CommandItem
                    key={g.id}
                    value={g.id}
                    onSelect={() => {
                      onValueChange(g.name_en, gnNumber)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <div className="flex flex-1 items-center gap-2">
                      <IconCheck
                        className={cn(
                          "size-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {g.name_en} ({gnNumber})
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {g.name_local} — {g.parent_name_en}
                          {g.postal_code && ` — ${g.postal_code}`}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
