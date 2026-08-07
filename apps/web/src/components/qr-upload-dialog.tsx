"use client"

import { useState, useCallback, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api-client"
import { QRCodeSVG } from "qrcode.react"
import { IconCopy, IconCheck } from "@tabler/icons-react"

interface QrSessionResponse {
  session_id: string
  upload_url: string
}

interface QrUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  docType: string
  enrollmentId: string
}

export function QrUploadDialog({
  open,
  onOpenChange,
  docType,
  enrollmentId,
}: QrUploadDialogProps) {
  const [uploadUrl, setUploadUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const createSession = useMutation({
    mutationFn: async (): Promise<QrSessionResponse> => {
      const response = await apiClient.post({
        url: "/api/uploads/qr-session",
        body: { doc_type: docType, enrollment_id: enrollmentId },
      })
      return response.data as QrSessionResponse
    },
    onSuccess: (data) => {
      setUploadUrl(data.upload_url)
    },
    onError: () => {
      toast.error("Failed to generate QR code")
    },
  })

  useEffect(() => {
    if (open) {
      createSession.mutate()
    }
  }, [open])

  const handleCopy = useCallback(async () => {
    if (!uploadUrl) return
    try {
      await navigator.clipboard.writeText(uploadUrl)
      setCopied(true)
      toast.success("URL copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy URL")
    }
  }, [uploadUrl])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload via Phone</DialogTitle>
          <DialogDescription>
            Scan this QR code with your phone to upload a file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {createSession.isPending ? (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dashed">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : uploadUrl ? (
            <>
              <div className="rounded-lg border bg-white p-4">
                <QRCodeSVG
                  value={uploadUrl}
                  size={192}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="flex w-full items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <IconCheck className="mr-2 size-4" />
                  ) : (
                    <IconCopy className="mr-2 size-4" />
                  )}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">Failed to load</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
