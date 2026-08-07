"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { presignedUploadUrlMutation } from "@/lib/api-client/@tanstack/react-query.gen"
import { apiClient } from "@/lib/api-client"
import { IconFileText, IconX, IconCloudUpload } from "@tabler/icons-react"
import type { Guardian } from "@/lib/api-client/types.gen"

export type DocumentFormData = {
  tempId: string
  doc_type: string
  file: File | null
  file_url: string
  file_key?: string
  content_type?: string
  file_size?: number
  file_name?: string
  file_type?: string
  status: "pending" | "uploaded"
}

interface Props {
  defaultValues: DocumentFormData[]
  guardians: Guardian[]
  onSave: (data: DocumentFormData[]) => Promise<void>
  onBack: () => void
  onNext: () => void
  onDocumentsChange?: (docs: DocumentFormData[]) => void
}

const DOC_TYPES: {
  key: string
  label: string
  condition?: (gs: Guardian[]) => boolean
}[] = [
  { key: "BirthCertificate", label: "Birth Certificate" },
  { key: "GuardianNIC", label: "Guardian NIC" },
  { key: "ResidenceProof", label: "Residence Proof" },
  { key: "ElectoralProof", label: "Electoral/Voter Registration" },
  { key: "SiblingSchoolCertificate", label: "Sibling School Certificate" },
  { key: "StaffAppointmentLetter", label: "Staff Appointment Letter" },
  { key: "StaffServiceCertificate", label: "Staff Service Certificate" },
  { key: "AlumniCertificate", label: "Alumni Certificate" },
  { key: "GovtEmployeeCertificate", label: "Govt Employee Certificate" },
  { key: "IncomeCertificate", label: "Income Certificate" },
  { key: "DisabilityCertificate", label: "Disability Certificate" },
  { key: "BaptismCertificate", label: "Baptism Certificate" },
  { key: "Other", label: "Other Document" },
]

export function WizardStepDocuments({
  defaultValues,
  guardians,
  onSave,
  onBack,
  onNext,
  onDocumentsChange,
}: Props) {
  const [documents, setDocuments] = useState<DocumentFormData[]>(defaultValues)
  const docsRef = useRef(documents)
  docsRef.current = documents

  useEffect(() => {
    setDocuments(defaultValues)
  }, [defaultValues])

  const presignedUrl = useMutation(
    presignedUploadUrlMutation({ client: apiClient })
  )
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingDocType = useRef<string | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  const getDoc = useCallback(
    (key: string) => {
      return documents.find((d) => d.doc_type === key)
    },
    [documents]
  )

  const updateDocs = useCallback(
    (updated: DocumentFormData[]) => {
      setDocuments(updated)
      docsRef.current = updated
      onDocumentsChange?.(updated)
    },
    [onDocumentsChange]
  )

  const uploadAndSave = useCallback(
    async (docType: string, file: File) => {
      setUploadingKey(docType)
      try {
        const {
          key,
          url: presignedUrlStr,
          public_url,
          content_type,
          file_size,
        } = await presignedUrl.mutateAsync({
          body: {
            file_name: file.name,
            content_type: file.type,
            file_size: file.size as unknown as bigint,
          },
          client: apiClient,
        })
        const response = await fetch(presignedUrlStr, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        })
        if (!response.ok) throw new Error("Upload failed")
        const existing = docsRef.current.filter((d) => d.doc_type !== docType)
        const uploaded = [
          ...existing,
          {
            tempId: crypto.randomUUID(),
            doc_type: docType,
            file: null,
            file_url: public_url,
            file_key: key,
            content_type,
            file_size: Number(file_size),
            file_name: file.name,
            file_type: file.type,
            status: "uploaded" as const,
          },
        ]
        updateDocs(uploaded)
        await onSave(uploaded)
      } catch (error) {
        const blobUrl = URL.createObjectURL(file)
        const existing = docsRef.current.filter((d) => d.doc_type !== docType)
        const fallback = [
          ...existing,
          {
            tempId: crypto.randomUUID(),
            doc_type: docType,
            file,
            file_url: blobUrl,
            file_name: file.name,
            file_type: file.type,
            status: "pending" as const,
          },
        ]
        updateDocs(fallback)
        toast.error(
          "Upload failed. The file has been saved locally but will need to be re-uploaded."
        )
      }
      setUploadingKey(null)
    },
    [presignedUrl, updateDocs, onSave]
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      const docType = pendingDocType.current
      if (!file || !docType) return
      if (fileInputRef.current) fileInputRef.current.value = ""
      uploadAndSave(docType, file)
    },
    [uploadAndSave]
  )

  const triggerUpload = useCallback((docKey: string) => {
    pendingDocType.current = docKey
    fileInputRef.current?.click()
  }, [])

  const removeDoc = useCallback(
    async (docKey: string) => {
      const doc = docsRef.current.find((d) => d.doc_type === docKey)
      if (!doc) return
      if (doc.file_key) {
        try {
          await apiClient.delete({
            url: `/api/uploads/${encodeURIComponent(doc.file_key)}`,
          })
        } catch {
          // ignore S3 delete failure
        }
      }
      if (doc.file_url.startsWith("blob:")) URL.revokeObjectURL(doc.file_url)
      const remaining = docsRef.current.filter((d) => d.doc_type !== docKey)
      updateDocs(remaining)
      await onSave(remaining)
    },
    [updateDocs, onSave]
  )

  const handleDrop = useCallback(
    (docKey: string, e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverKey(null)
      const file = e.dataTransfer.files[0]
      uploadAndSave(docKey, file)
    },
    [uploadAndSave]
  )

  const handleDragOver = useCallback((docKey: string, e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverKey(docKey)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverKey(null)
  }, [])

  const activeDocs = DOC_TYPES.filter(
    (d) => !d.condition || d.condition(guardians)
  )

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileChange}
        accept="image/*,.pdf"
      />
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Upload required documents for verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {activeDocs.map((doc) => {
              const currentDoc = getDoc(doc.key)
              const isUploaded = currentDoc?.status === "uploaded"
              const isUploading = uploadingKey === doc.key
              const isDragOver = dragOverKey === doc.key
              return (
                <div
                  key={doc.key}
                  onDrop={(e) => handleDrop(doc.key, e)}
                  onDragOver={(e) => handleDragOver(doc.key, e)}
                  onDragLeave={handleDragLeave}
                  onClick={() =>
                    !isUploaded && !isUploading && triggerUpload(doc.key)
                  }
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-4 transition-all ${
                    isUploaded
                      ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/10"
                      : isDragOver
                        ? "scale-[1.02] border-primary bg-primary/5"
                        : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  {isUploaded && currentDoc.file_url ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-3">
                      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {currentDoc.file_type?.startsWith("image/") ? (
                          <img
                            src={currentDoc.file_url}
                            alt={currentDoc.file_name ?? doc.label}
                            className="size-full object-cover"
                          />
                        ) : (
                          <IconFileText className="size-5 text-foreground" />
                        )}
                      </div>
                      <p className="max-w-full truncate text-center text-sm font-medium">
                        {doc.label}
                      </p>
                      <p className="max-w-full truncate text-center text-xs text-muted-foreground">
                        {currentDoc.file_name ?? "Uploaded"}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeDoc(doc.key)
                        }}
                        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive"
                      >
                        <IconX className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-3">
                      {isUploading ? (
                        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      ) : (
                        <IconCloudUpload
                          className={`size-8 ${isDragOver ? "text-primary" : "text-muted-foreground/60"}`}
                        />
                      )}
                      <p className="text-sm font-medium">{doc.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {isUploading
                          ? "Uploading..."
                          : "Click or drag to upload"}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={async () => {
              await onSave(documents)
              onNext()
            }}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
