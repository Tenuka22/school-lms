"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { IconCloudUpload, IconCheck, IconAlertCircle } from "@tabler/icons-react"

export function QrUploadPage() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search))
  const session = searchParams.get("session")
  const docType = searchParams.get("doc_type")
  const enrollmentId = searchParams.get("enrollment_id")

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!session) {
      setError("Invalid or missing upload session")
    }
  }, [session])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file || !session) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(
        `/api/uploads/qr-upload?session=${encodeURIComponent(session)}`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Upload failed")
      }

      setUploaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }, [file, session])

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <IconAlertCircle className="size-12 text-destructive" />
            <h1 className="text-xl font-semibold">Invalid Upload Link</h1>
            <p className="text-center text-sm text-muted-foreground">
              This upload link is invalid. Please ask for a new QR code.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (uploaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <IconCheck className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-xl font-semibold">Upload Successful</h1>
            <p className="text-center text-sm text-muted-foreground">
              Your file has been uploaded successfully. You can close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            {docType ? `Uploading: ${docType}` : "Upload your document"}
            {enrollmentId && (
              <span className="block text-xs text-muted-foreground">
                Enrollment ID: {enrollmentId}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf"
          />

          {file ? (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 hover:bg-muted/30"
            >
              <IconCloudUpload className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Tap to select a file
              </p>
            </button>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Uploading...
              </>
            ) : (
              "Upload File"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
