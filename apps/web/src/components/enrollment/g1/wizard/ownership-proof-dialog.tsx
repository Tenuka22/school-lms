"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { presignedUploadUrlMutation } from "@/lib/api-client/@tanstack/react-query.gen"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { apiClient } from "@/lib/api-client"
import { toastApiError } from "@/lib/api-error"
import {
  IconLoader2,
  IconUpload,
  IconX,
  IconFile,
  IconPhoto,
  IconDownload,
} from "@tabler/icons-react"

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]
const isImageUrl = (url: string) =>
  IMAGE_EXTENSIONS.some((ext) => url.toLowerCase().includes(ext))

export type OwnershipProofEntry = {
  proof_type: string
  file_url?: string
  file_name?: string
}

export const OWNERSHIP_PROOF_TYPES = [
  { value: "title_deed", label: "Deed of Title", si: "සින්නක්කර ඔප්පු" },
  { value: "land_grant", label: "Land Grant", si: "බිම්සවිය සභතිකය" },
  { value: "gift_deed", label: "Gift Deed", si: "තෑගි ඔප්පු" },
  { value: "allotment_letter", label: "Allotment Letter", si: "දීමනා පත්‍ර" },
  { value: "govt_grant", label: "Government Grant", si: "රජයේ ප්‍රදාන" },
  { value: "lease_deed_30yr", label: "Lease Deed (30+ years)", si: "දීර්ඝ කාලීන බදු ඔප්පු" },
  { value: "registered_declaration_10yr", label: "Registered Declaration (10+ years)", si: "පනත් ඉරුමඟින් සනාථ කර ඇති වසර 10+ කට වැඩි ප්‍රකාශන ඔප්පු" },
  { value: "govt_installment_house", label: "Govt Installment House (fully paid, not transferred)", si: "රාජා/අර්ධ රාජ්‍ය ආයතනයකින් ගෙවීමේ පදනම මත මිල දී ගෙන සම්පූර්ණ මුදලම ගෙවා අවසන් කර ඇති නමුත් මෙතෙක් අදාළ ආයතන මඟින් එහි හිමිකරු වෙත දේපල පවරා නොමැති නිවාස" },
  { value: "rental_agreement", label: "Rental Agreement", si: "ඇනි ගෙවල් කුලී පනත යටතේ ලියාපදිංචි කුලී නිවැසියන් බව සනාථ කරන ලේඛන" },
  { value: "govt_housing_allocation", label: "Govt Housing Allocation Letter", si: "රජයේ නිල නිවාස ලේඛනය (දෙපාර්ත මේන්තූ ප්‍රධානිගේ තහවුරු කිරීමේ ලිපිය)" },
  { value: "govt_installment_receipt", label: "Govt/Half-Govt Installment Receipts", si: "රාජ්‍ය/අර්ධ රාජ්‍ය ආයතනයකින් ගෙවීමේ පදනම මත මිල දී ගෙන ඇති එහෙත් ගෙවීම අවසන් කර නොමැති නිවාස ලේඛන" },
  { value: "temple_lease", label: "Temple/Devala Religious Lease", si: "1931 අංක 19 දරණ විහාර හා දේවාල ගම් පනත යටතේ චාර්ෂික බදු පදනම මත ලබා දී ඇති බදු ඔප්පු" },
  { value: "govt_land_residence_cert", label: "8+ Years on Govt Land (Commissioner/GA Certificate)", si: "අයදුම්කරු/කලත්‍රයා අඛණ්ඩ ව වසර 08කට වඩා වැඩි කාලයක් රජයේ ඉඩමක පදිංචි බවට සහතිකය" },
  { value: "estate_residence_cert", label: "Estate Worker Residence Certificate", si: "වතු ආශ්‍රිත නිවාසවල පදිංචි බවට වතු අධිකාරී/ප්‍රාදේශීය ලේකම් සහතිකය" },
  { value: "other_recognized", label: "Other Recognized Documents", si: "වෙනත් පිළිගත හැකි ලේඛන" },
] as const

export const SUPPLEMENTARY_PROOF_TYPES = [
  { value: "electricity_bill", label: "Electricity Bill", si: "විදුලි බිල්පත්" },
  { value: "water_bill", label: "Water Bill", si: "ජල බිල්පත්" },
  { value: "property_tax_bill", label: "Property Tax Bill", si: "චරිපනම් බදු බිල්පත්" },
  { value: "acre_tax_bill", label: "Acre Tax Bill", si: "අක්කර බදු බිල්පත්" },
  { value: "birth_certificate", label: "Birth Certificate", si: "උප්පැන්න සහතික" },
] as const

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  addressId: string
  existingProofs: OwnershipProofEntry[]
  onSave: (proofs: OwnershipProofEntry[]) => void
}

export function OwnershipProofDialog({
  open,
  onOpenChange,
  addressId,
  existingProofs,
  onSave,
}: Props) {
  const [proofs, setProofs] = useState<OwnershipProofEntry[]>(existingProofs)
  const [uploading, setUploading] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<{
    url: string
    name: string
  } | null>(null)

  const presignedUrl = useMutation(
    presignedUploadUrlMutation({ client: apiClient })
  )

  const toggleProof = (proofType: string) => {
    setProofs((prev) => {
      const exists = prev.find((p) => p.proof_type === proofType)
      if (exists) {
        return prev.filter((p) => p.proof_type !== proofType)
      }
      return [...prev, { proof_type: proofType }]
    })
  }

  const handleUpload = async (proofType: string, file: File) => {
    setUploading(proofType)
    try {
      const { url: presignedUrlStr, public_url } =
        await presignedUrl.mutateAsync({
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
      setProofs((prev) =>
        prev.map((p) =>
          p.proof_type === proofType
            ? { ...p, file_url: public_url, file_name: file.name }
            : p
        )
      )
      toast.success("Proof uploaded")
    } catch (e) {
      toastApiError(e, "Upload failed")
    } finally {
      setUploading(null)
    }
  }

  const removeFile = (proofType: string) => {
    setProofs((prev) =>
      prev.map((p) =>
        p.proof_type === proofType
          ? { ...p, file_url: undefined, file_name: undefined }
          : p
      )
    )
  }

  const handleSave = () => {
    onSave(proofs)
    onOpenChange(false)
  }

  const renderProofRow = (pt: { value: string; label: string; si: string }) => {
    const entry = proofs.find((p) => p.proof_type === pt.value)
    const checked = !!entry
    const fileInputId = `proof-${addressId}-${pt.value}`
    return (
      <div
        key={pt.value}
        className="flex items-start gap-2 rounded-md border p-2"
      >
        <Checkbox
          id={fileInputId}
          checked={checked}
          onCheckedChange={() => toggleProof(pt.value)}
          className="mt-0.5"
        />
        <label htmlFor={fileInputId} className="flex-1 cursor-pointer">
          <span className="text-sm">{pt.label}</span>
          <span className="ml-1.5 text-xs text-muted-foreground">
            ({pt.si})
          </span>
        </label>
        {checked && (
          <div className="flex items-center gap-1">
            {entry?.file_url ? (
              <div className="flex items-center gap-1">
                <Badge
                  variant="secondary"
                  className="text-[10px] gap-1 max-w-[140px] cursor-pointer hover:bg-accent"
                  onClick={() =>
                    setPreviewFile({
                      url: entry.file_url!,
                      name: entry.file_name || "Uploaded file",
                    })
                  }
                >
                  {isImageUrl(entry.file_url) ? (
                    <IconPhoto className="size-3 shrink-0" />
                  ) : (
                    <IconFile className="size-3 shrink-0" />
                  )}
                  <span className="truncate">{entry.file_name}</span>
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-5"
                  onClick={() => removeFile(pt.value)}
                >
                  <IconX className="size-3" />
                </Button>
              </div>
            ) : uploading === pt.value ? (
              <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-5"
                onClick={() => {
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = "image/*,.pdf"
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleUpload(pt.value, file)
                  }
                  input.click()
                }}
              >
                <IconUpload className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ownership Proof (හිමිකම ඔප්පු කිරීම)</DialogTitle>
          <DialogDescription>
            Select the proof documents you have for this address and upload files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Primary Documents (ප්‍රධාන ලේඛන)
            </p>
            <div className="space-y-2">
              {OWNERSHIP_PROOF_TYPES.map(renderProofRow)}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Supplementary Documents (අතිරේක ලේඛන)
            </p>
            <p className="text-[11px] text-muted-foreground mb-2">
              For residence confirmation (6-year period). 0.2 points per
              document in applicant's name, 0.1 in parent's name.
            </p>
            <div className="space-y-2">
              {SUPPLEMENTARY_PROOF_TYPES.map(renderProofRow)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Proofs ({proofs.length})
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Image preview lightbox */}
      <Dialog
        open={!!previewFile}
        onOpenChange={(v) => !v && setPreviewFile(null)}
      >
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-sm">{previewFile?.name}</DialogTitle>
            <DialogDescription>
              Click download to save this file
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/50 px-6 pb-2">
            {previewFile && isImageUrl(previewFile.url) ? (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-h-[60vh] w-auto rounded-md object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <IconFile className="size-12" />
                <p className="text-sm">Preview not available for this file type</p>
                <p className="text-xs">Click download to view</p>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewFile(null)}
            >
              Close
            </Button>
            {previewFile?.url && (
              <Button
                size="sm"
                onClick={() => {
                  const a = document.createElement("a")
                  a.href = previewFile.url
                  a.download = previewFile.name
                  a.click()
                }}
              >
                <IconDownload className="size-4 mr-1.5" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
