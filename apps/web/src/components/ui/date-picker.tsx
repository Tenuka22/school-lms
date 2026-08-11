"use client"

import { useState, useCallback } from "react"
import { format, parse, isValid } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { IconCalendar } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string | null
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)

  const date = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined
  const display = date && isValid(date) ? format(date, "MMM d, yyyy") : ""

  const handleSelect = useCallback(
    (d: Date | undefined) => {
      if (d && isValid(d)) {
        onChange?.(format(d, "yyyy-MM-dd"))
      }
      setOpen(false)
    },
    [onChange]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn(
              "w-full justify-start font-normal",
              !display && "text-muted-foreground",
              className
            )}
          >
            <IconCalendar className="mr-2 size-4 shrink-0" />
            {display || placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  )
}
