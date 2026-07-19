"use client"

import { useCallback, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { uploadFileMutation } from "@/lib/api-client/@tanstack/react-query.gen"
import { apiClient } from "@/lib/api-client"
import { Upload } from "lucide-react"
import type { GuardianData, DocumentData } from "./wizard-shell"

interface Props {
  documents: DocumentData[]
  guardians: GuardianData[]
  onChange: (docs: DocumentData[]) => void
  onBack: () => void
  onNext: () => void
}

const REQUIRED_DOCS: { key: string; label: string; condition?: (gs: GuardianData[]) => boolean }[] = [
  { key: "BirthCertificate", label: "Birth Certificate" },
  { key: "GuardianNIC", label: "Guardian NIC" },
  { key: "ResidenceProof", label: "Residence Proof" },
  {
    key: "StaffAppointmentLetter",
    label: "Staff Appointment Letter",
    condition: (gs) => gs.some((g) => g.is_staff),
  },
  {
    key: "StaffServiceCertificate",
    label: "Staff Service Certificate",
    condition: (gs) => gs.some((g) => g.is_staff),
  },
  {
    key: "PastPupilCertificate",
    label: "Past Pupil Certificate",
    condition: (gs) => gs.some((g) => g.is_alumni),
  },
  {
    key: "GovtServiceCertificate",
    label: "Govt Service Certificate",
    condition: (gs) => gs.some((g) => g.is_govt_employee),
  },
  {
    key: "DisabilityCertificate",
    label: "Disability Certificate",
    condition: (gs) => gs.some((g) => g.disability),
  },
]

export function WizardStepDocuments({ documents, guardians, onChange, onBack, onNext }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useMutation(uploadFileMutation({ client: apiClient }))

  const requiredTypes = REQUIRED_DOCS.filter((d) => !d.condition || d.condition(guardians))

  const handleUpload = useCallback(
    async (docType: string, file: File) => {
      const existing = documents.find((d) => d.doc_type === docType && d.status === "uploaded")
      if (existing) return

      const tempId = crypto.randomUUID()
      const pending: DocumentData = { tempId, doc_type: docType, file, file_url: "", status: "pending" }
      onChange([...documents, pending])

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("document_type", docType)
        const result = await uploadMutation.mutateAsync({
          body: formData as any,
          client: apiClient,
        })
        onChange(
          documents.map((d) =>
            d.tempId === tempId ? { ...d, file_url: result.url ?? "", status: "uploaded" as const } : d,
          ).concat(pending.tempId === tempId ? [] : []),
        )
      } catch {
        onChange(documents.filter((d) => d.tempId !== tempId))
      }
    },
    [documents, onChange, uploadMutation],
  )

  const allRequiredUploaded = requiredTypes.every((rt) =>
    documents.some((d) => d.doc_type === rt.key && d.status === "uploaded"),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 6: Document Upload</CardTitle>
        <CardDescription>Upload all required documents.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <span>Required: {documents.filter((d) => d.status === "uploaded").length}/{requiredTypes.length}</span>
          {!allRequiredUploaded && (
            <Badge variant="secondary">Missing documents</Badge>
          )}
        </div>
        {requiredTypes.map((rt) => {
          const doc = documents.find((d) => d.doc_type === rt.key)
          const uploaded = doc?.status === "uploaded"
          return (
            <div key={rt.key} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label>{rt.label}</Label>
                {uploaded ? (
                  <Badge variant="default">Uploaded</Badge>
                ) : (
                  <Badge variant="secondary">Missing</Badge>
                )}
              </div>
              {!uploaded && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(rt.key, file)
                    }}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-4 mr-2" /> Upload
                  </Button>
                </div>
              )}
              {doc?.file && doc.status === "pending" && (
                <p className="text-xs text-muted-foreground">Uploading...</p>
              )}
            </div>
          )
        })}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onNext} disabled={!allRequiredUploaded}>Next</Button>
        </div>
      </CardContent>
    </Card>
  )
}
