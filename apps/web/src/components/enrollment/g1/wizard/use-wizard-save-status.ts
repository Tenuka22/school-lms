"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { toastApiError } from "@/lib/api-error"

export type SaveStatus = "idle" | "saving" | "done"

export function useWizardSaveStatus(onNext: () => void) {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const navigateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (navigateTimer.current) clearTimeout(navigateTimer.current)
    }
  }, [])

  const executeSave = useCallback(
    async (saveFn: () => Promise<void>, errorMessage?: string) => {
      setStatus("saving")
      try {
        await saveFn()
        setStatus("done")
        navigateTimer.current = setTimeout(() => onNext(), 400)
      } catch (e) {
        console.error("Save failed:", e)
        setStatus("idle")
        toastApiError(e, errorMessage ?? "Failed to save. Please try again.")
      }
    },
    [onNext]
  )

  return { status, executeSave }
}
