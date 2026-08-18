"use client"

import { useCallback, useRef, useState, useMemo } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { DocumentFormData } from "../wizard/wizard-step-documents"
import { presignedUploadUrlMutation } from "@/lib/api-client/@tanstack/react-query.gen"
import { apiClient } from "@/lib/api-client"
import {
  IconFileText,
  IconCheck,
  IconAlertTriangle,
  IconClipboardCheck,
  IconCloudUpload,
  IconEye,
  IconX,
} from "@tabler/icons-react"

const DOC_TYPES: { key: string; label: string }[] = [
  { key: "BirthCertificate", label: "Birth Certificate" },
  { key: "GuardianNIC", label: "Guardian NIC" },
  { key: "ResidenceProof", label: "Residence Proof" },
  { key: "ElectoralProof", label: "Electoral / Voter Registration" },
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

const REQUIRED_TYPES = [
  "BirthCertificate",
  "GuardianNIC",
  "ResidenceProof",
  "ElectoralProof",
]

interface Props {
  documents: DocumentFormData[]
  onDocumentsChange?: (docs: DocumentFormData[]) => void
  onBack: () => void
  onNext: () => void
  isDisqualified?: boolean
  onFlagForForge?: (docType: string) => void
}

export function InterviewStepDocuments({
  documents,
  onDocumentsChange,
  onBack,
  onNext,
  isDisqualified,
  onFlagForForge,
}: Props) {
  const [verificationState, setVerificationState] = useState<
    Record<string, boolean>
  >({})
  const [previewDoc, setPreviewDoc] = useState<DocumentFormData | null>(null)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [forgedDocType, setForgedDocType] = useState<string | null>(null)
  const [showForgeryConfirm, setShowForgeryConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingDocType = useRef<string | null>(null)
  const docsRef = useRef(documents)
  docsRef.current = documents

  const presignedUrl = useMutation(
    presignedUploadUrlMutation({ client: apiClient })
  )

  const docMap = useMemo(() => {
    const map = new Map<string, DocumentFormData>()
    for (const d of documents) {
      if (!map.has(d.doc_type)) map.set(d.doc_type, d)
    }
    return map
  }, [documents])

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
        const uploaded: DocumentFormData[] = [
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
        onDocumentsChange?.(uploaded)
        toast.success(`${file.name} uploaded`)
      } catch {
        toast.error("Upload failed. Please try again.")
      }
      setUploadingKey(null)
    },
    [presignedUrl, onDocumentsChange]
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

  const handleDrop = useCallback(
    (docKey: string, e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverKey(null)
      const file = e.dataTransfer.files[0]
      if (file) uploadAndSave(docKey, file)
    },
    [uploadAndSave]
  )

  const handleVerify = (docType: string, verified: boolean) => {
    setVerificationState((prev) => ({ ...prev, [docType]: verified }))
  }

  const handleForgeryClick = (docType: string) => {
    setForgedDocType(docType)
    setShowForgeryConfirm(true)
  }

  const handleForgeryConfirm = () => {
    if (forgedDocType && onFlagForForge) {
      onFlagForForge(forgedDocType)
    }
    setShowForgeryConfirm(false)
    setForgedDocType(null)
  }

  const allRequiredVerified = REQUIRED_TYPES.every((docType) => {
    const hasDoc = docMap.has(docType)
    const verified = verificationState[docType] === true
    return hasDoc && verified
  })

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileChange}
        accept="image/*,.pdf"
      />
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Document Verification</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Per circular section 6.2, the panel must verify all original
            documents against the application before scoring. The applicant must
            bring original birth certificate and all original documents on the
            interview day.
          </p>
        </div>

        {/* Verification Notice */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
          <IconClipboardCheck className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Document Verification Checklist
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
              Verify each document against the original. Check for authenticity,
              expiry dates, and that the information matches the application.
              Per circular 7.1.3, if any document is found to be forged, the
              applicant is disqualified from ALL categories.
            </p>
          </div>
        </div>

        {/* Required Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>
              Upload if missing, then verify against the original.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {REQUIRED_TYPES.map((docType) => {
                const doc = docMap.get(docType)
                const hasDoc = !!doc
                const verified = verificationState[docType] === true
                const isUploading = uploadingKey === docType
                const isDragOver = dragOverKey === docType
                const label =
                  DOC_TYPES.find((d) => d.key === docType)?.label ?? docType
                const isImage = doc?.file_type?.startsWith("image/")

                return (
                  <div
                    key={docType}
                    onDrop={(e) => handleDrop(docType, e)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOverKey(docType)
                    }}
                    onDragLeave={() => setDragOverKey(null)}
                    className={`rounded-lg border p-3 transition-all ${
                      verified
                        ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                        : isDragOver
                          ? "scale-[1.01] border-primary bg-primary/5"
                          : hasDoc
                            ? "border-border"
                            : "border-dashed border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        className="mt-0.5"
                        checked={verified}
                        disabled={!hasDoc}
                        onCheckedChange={(checked) =>
                          handleVerify(docType, checked === true)
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{label}</p>
                        {hasDoc && doc ? (
                          <div className="mt-2 flex items-center gap-3">
                            {isImage && doc.file_url ? (
                              <img
                                src={doc.file_url}
                                alt={doc.file_name ?? label}
                                className="h-24 w-24 shrink-0 rounded-lg border object-cover"
                              />
                            ) : (
                              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border bg-muted">
                                <IconFileText className="size-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs text-muted-foreground">
                                {doc.file_name}
                              </p>
                              <div className="mt-2 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setPreviewDoc(doc)}
                                >
                                  <IconEye className="mr-1 size-3" /> View
                                </Button>
                                {!isDisqualified && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => triggerUpload(docType)}
                                  >
                                    Replace
                                  </Button>
                                )}
                                {!isDisqualified && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleForgeryClick(docType)}
                                  >
                                    <IconX className="mr-1 size-3" /> Flag as Forged
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() =>
                              !isUploading && triggerUpload(docType)
                            }
                            className="mt-2 flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed p-4 hover:bg-muted/30"
                          >
                            {isUploading ? (
                              <p className="text-xs text-muted-foreground">
                                Uploading...
                              </p>
                            ) : (
                              <>
                                <IconCloudUpload className="size-5 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                  Click or drag to upload
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {verified && (
                        <IconCheck className="size-4 shrink-0 text-green-600" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Other Uploaded Documents */}
        {documents.filter((d) => !REQUIRED_TYPES.includes(d.doc_type)).length >
          0 && (
          <Card>
            <CardHeader>
              <CardTitle>Other Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documents
                  .filter((d) => !REQUIRED_TYPES.includes(d.doc_type))
                  .map((doc) => {
                    const isImage = doc.file_type?.startsWith("image/")
                    const label =
                      DOC_TYPES.find((d) => d.key === doc.doc_type)?.label ??
                      doc.doc_type
                    return (
                      <div
                        key={doc.tempId}
                        className="flex items-center gap-3 rounded-lg border p-2.5"
                      >
                        {isImage && doc.file_url ? (
                          <img
                            src={doc.file_url}
                            alt={doc.file_name ?? label}
                            className="h-14 w-14 shrink-0 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border bg-muted">
                            <IconFileText className="size-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {label}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {doc.file_name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <IconEye className="mr-1 size-3" /> View
                        </Button>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forgery Warning */}
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <IconAlertTriangle className="size-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Forged Document Penalty
            </p>
            <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
              Per circular 7.1.3: If any document is found to be forged or
              falsified, the applicant will be disqualified from ALL categories
              at this school.
            </p>
          </div>
        </div>

        {/* Disqualified Notice */}
        {isDisqualified && (
          <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-100 p-4 dark:border-red-700 dark:bg-red-900/30">
            <IconX className="size-5 shrink-0 text-red-700 dark:text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                Application Disqualified
              </p>
              <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
                Per circular 7.1.3, this application has been disqualified from
                all categories due to a forged document. No further action can
                be taken on this application. Per circular 13.0, note that
                accepting or giving money or gifts for admission is prohibited.
              </p>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between border-t pt-4">
          <Button variant="outline" onClick={onBack} disabled={isDisqualified}>
            Back
          </Button>
          {isDisqualified ? (
            <Button disabled variant="secondary">
              Application Disqualified
            </Button>
          ) : allRequiredVerified ? (
            <Button onClick={onNext}>Proceed to Category Scoring</Button>
          ) : (
            <Button onClick={() => setShowSkipConfirm(true)}>
              Proceed Without All Documents
            </Button>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="w-[70vw] max-w-[70vw]">
          <DialogHeader>
            <DialogTitle>{previewDoc?.doc_type}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="flex items-center justify-center">
              {previewDoc.file_type?.startsWith("image/") ? (
                <img
                  src={previewDoc.file_url}
                  alt={previewDoc.file_name ?? previewDoc.doc_type}
                  className="max-h-[75vh] w-full rounded-lg object-contain"
                />
              ) : previewDoc.file_type === "application/pdf" ? (
                <iframe
                  src={previewDoc.file_url}
                  className="h-[75vh] w-full rounded-lg border"
                  title={previewDoc.file_name ?? previewDoc.doc_type}
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-10">
                  <IconFileText className="size-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {previewDoc.file_name ?? "Document"}
                  </p>
                  <a
                    href={previewDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      Open in new tab
                    </Button>
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Proceed Without All Documents?</AlertDialogTitle>
            <AlertDialogDescription>
              Some required documents have not been uploaded or verified. Per
              circular section 6.2, all original documents must be verified
              before scoring. If any document is missing or unverified, the
              panel may not be able to fairly assess the applicant's eligibility
              for certain categories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={onNext}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Proceed Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forgery Confirmation Dialog */}
      <AlertDialog open={showForgeryConfirm} onOpenChange={setShowForgeryConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 dark:text-red-300">
              Flag Document as Forged?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to flag{" "}
              <strong>
                {forgedDocType
                  ? DOC_TYPES.find((d) => d.key === forgedDocType)?.label ??
                    forgedDocType
                  : "this document"}
              </strong>{" "}
              as forged or falsified. Per circular 7.1.3, this will
              automatically disqualify the applicant from ALL categories at this
              school. Per circular 13.0, accepting or giving money or gifts for
              admission is strictly prohibited. This action will be logged in
              the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForgeryConfirm}
              className="bg-red-600 text-destructive-foreground hover:bg-red-700"
            >
              Yes, Flag as Forged
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
