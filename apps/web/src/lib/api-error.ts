import { toast } from "sonner"

export function getApiErrorMessage(err: unknown): string | null {
  if (!err) return null

  if (typeof err === "object" && "error" in err) {
    const msg = (err).error
    if (typeof msg === "string" && msg.length > 0) return msg
  }

  if (err instanceof Error) return err.message

  if (typeof err === "string") return err

  return null
}

export function toastApiError(err: unknown, fallback?: string): void {
  toast.error(
    getApiErrorMessage(err) ?? fallback ?? "An unexpected error occurred"
  )
}
