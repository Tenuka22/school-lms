"use client"

import { Button } from "@/components/ui/button"
import { IconLoader2, IconCheck } from "@tabler/icons-react"
import type { SaveStatus } from "./use-wizard-save-status"

interface WizardNextButtonProps {
  status: SaveStatus
  onClick: () => void
  disabled?: boolean
  label?: string
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
}

export function WizardNextButton({
  status,
  onClick,
  disabled,
  label = "Next",
  variant = "default",
}: WizardNextButtonProps) {
  return (
    <Button variant={variant} onClick={onClick} disabled={disabled ?? status !== "idle"}>
      {status === "saving" && (
        <IconLoader2 className="mr-1.5 size-4 animate-spin" />
      )}
      {status === "done" && (
        <IconCheck className="mr-1.5 size-4 text-green-600" />
      )}
      {status === "idle"
        ? label
        : status === "saving"
          ? "Saving…"
          : "Saved"}
    </Button>
  )
}
