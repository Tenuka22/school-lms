# Document Management Page

## Route
`/student-management/enrollment/g1/$application-id/documents`
> File: `apps/web/src/routes/_authenticated/student-management/enrollment/g1/$application-id.documents.tsx`

---

## Entity Connection

```
g1_applications ──► g1_documents (one-to-many)
                        │
                        ├── document_type: G1DocumentType enum
                        ├── file_url / file_key (S3/B2)
                        ├── file_hash (SHA-256)
                        ├── verification_status: DocumentVerificationStatus
                        │   └── Pending | Verified | Rejected | Flagged
                        ├── verified_by → users
                        ├── rejection_reason
                        └── fraud_flag: bool
```

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Application #G1-2027-00042            [Bulk Upload]  │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌───────────────────────────────┐  │
│  │  Birth Certificate      │  │  Residence Proof              │  │
│  │  ┌─────────────────┐   │  │  ┌───────────────────────┐   │  │
│  │  │  [PDF Preview]  │   │  │  │ [Image Preview]       │   │  │
│  │  │  Thumbnail      │   │  │  │ Thumbnail             │   │  │
│  │  └─────────────────┘   │  │  └───────────────────────┘   │  │
│  │  Status: ✅ Verified   │  │  Status: ⏳ Pending          │  │
│  │  SHA256: ab12cd...     │  │  Uploaded: 2027-03-15       │  │
│  │  Verified by: Officer1 │  │  [Mark Verified] [Reject]   │  │
│  │  [Replace] [Download]  │  │                               │  │
│  └─────────────────────────┘  └───────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────┐  ┌───────────────────────────────┐  │
│  │  Guardian NIC           │  │  Staff Appointment Letter      │  │
│  │  Status: ✅ Verified    │  │  Status: ⚠️ Flagged            │  │
│  └─────────────────────────┘  └───────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────┐                                 │
│  │  + Upload New Document       │                                 │
│  │  Type: [Select document]     │                                 │
│  │  [Drag & drop zone]          │                                 │
│  └──────────────────────────────┘                                 │
└──────────────────────────────────────────────────────────────────┘
```

## Document Grid

Responsive grid layout: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`.

Each document card:

```tsx
<Card className={cn(
  "p-4",
  doc.fraud_flag && "border-destructive ring-1 ring-destructive/30"
)}>
  <div className="flex items-start justify-between mb-3">
    <div className="flex items-center gap-2">
      <DocIcon type={doc.document_type} className="size-5" />
      <h4 className="font-medium text-sm">{getDocLabel(doc.document_type)}</h4>
    </div>
    <VerificationBadge status={doc.verification_status} />
  </div>

  {/* File Preview */}
  <div className="h-32 bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
    {isImage(doc) ? (
      <img src={doc.file_url} alt="" className="w-full h-full object-cover" />
    ) : (
      <FileIcon className="size-10 text-muted-foreground" />
    )}
  </div>

  {/* File Info */}
  <div className="space-y-1 mb-3">
    <p className="text-xs text-muted-foreground">SHA256: {truncateHash(doc.file_hash)}</p>
    <p className="text-xs text-muted-foreground">Size: {formatBytes(doc.file_size)}</p>
    <p className="text-xs text-muted-foreground">Uploaded: {formatDate(doc.uploaded_at)}</p>
  </div>

  {/* Verified Info */}
  {doc.verification_status === 'Verified' && doc.verified_by && (
    <div className="flex items-center gap-2 text-xs text-green-600 mb-3">
      <CheckCircle className="size-3" />
      Verified by {doc.verifier_name} on {formatDate(doc.verified_at)}
    </div>
  )}

  {/* Rejection Reason */}
  {doc.verification_status === 'Rejected' && doc.rejection_reason && (
    <div className="p-2 bg-destructive/10 rounded-lg text-xs text-destructive mb-3">
      <AlertTriangle className="size-3 inline mr-1" />
      {doc.rejection_reason}
    </div>
  )}

  {/* Fraud Flag */}
  {doc.fraud_flag && (
    <div className="p-2 bg-amber-500/10 rounded-lg text-xs text-amber-600 dark:text-amber-400 mb-3">
      <ShieldAlert className="size-3 inline mr-1" />
      Flagged for fraud review
    </div>
  )}

  {/* Action Buttons */}
  <div className="flex gap-2">
    <Button variant="outline" size="sm">
      <Download className="size-3.5 mr-1" /> Download
    </Button>
    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
      <Trash2 className="size-3.5 mr-1" /> Replace
    </Button>
  </div>
</Card>
```

---

## Verification Badge Component

```tsx
function VerificationBadge({ status }: { status: DocumentVerificationStatus }) {
  const variantMap = {
    Pending: "secondary",
    Verified: "default",
    Rejected: "destructive",
    Flagged: "outline", // with amber styling
  }
  const iconMap = {
    Pending: <Clock className="size-3" />,
    Verified: <CheckCircle className="size-3" />,
    Rejected: <XCircle className="size-3" />,
    Flagged: <AlertTriangle className="size-3" />,
  }
  return (
    <Badge variant={variantMap[status]} className="gap-1">
      {iconMap[status]}
      {status}
    </Badge>
  )
}
```

---

## Upload New Document Dialog

Triggered by the "+ Upload New Document" card at the bottom or via "Bulk Upload" button.

### Dialog Content
```tsx
<Dialog>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Upload Document</DialogTitle>
      <DialogDescription>
        Select document type and upload the file.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      {/* Document Type Selector */}
      <Field>
        <FieldLabel>Document Type</FieldLabel>
        <Select>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {requiredDocTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {getDocLabel(type)}
                {alreadyUploaded[type] && " ✓"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Drop Zone */}
      <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 cursor-pointer transition-colors">
        <Upload className="size-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Drag and drop or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 5MB</p>
      </div>

      {/* File Preview & Progress */}
      {selectedFile && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileIcon className="size-4" />
            <span className="text-sm">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</span>
          </div>
          {uploadProgress < 100 && (
            <Progress value={uploadProgress} className="h-1" />
          )}
        </div>
      )}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button disabled={!selectedFile}>
        {isUploading ? <LoaderCircle className="size-4 animate-spin mr-2" /> : null}
        Upload
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Fraud Flag Indicators

When `fraud_flag: true`, the document card gets:
1. **Red/amber border** + subtle ring
2. **Fraud warning banner** inline (amber, with `ShieldAlert` icon)
3. **Fraud details** expandable via `Collapsible`:
   ```tsx
   <Collapsible>
     <CollapsibleTrigger className="text-xs text-amber-600 underline">
       View fraud details
     </CollapsibleTrigger>
     <CollapsibleContent className="text-xs mt-2 p-2 bg-amber-500/5 rounded">
       <p>Reason: Duplicate document hash detected</p>
       <p>Matched with: App #G1-2027-00123</p>
       <p>Detected: 2027-03-15</p>
     </CollapsibleContent>
   </Collapsible>
   ```

---

## Missing Document Indicator

At the top of the page, a summary strip shows:
```
Required Documents: 5/6 uploaded  ⚠️ Missing: Sibling School Certificate
```

```tsx
<div className={cn(
  "p-3 rounded-lg border mb-4 flex items-center gap-2",
  allUploaded ? "bg-green-500/10 border-green-500/30" : "bg-amber-500/10 border-amber-500/30"
)}>
  {allUploaded
    ? <><CheckCircle className="size-4 text-green-600" /> All required documents uploaded</>
    : <><AlertTriangle className="size-4 text-amber-600" /> Missing: {missingDocs.join(", ")}</>
  }
</div>
```

---

## Document Download

Clicking "Download" on a document card triggers a file download using the `file_url` (S3/B2 presigned URL or direct URL). For images, clicking the preview thumbnail opens a full-size `Dialog` with the image.

---

## Verification Actions (Officer Only)

If the current user has role `VerificationOfficer` or `ZonalOfficer`, each document card shows additional action buttons:

```tsx
<div className="flex gap-2 mt-3 pt-3 border-t">
  <Button variant="default" size="sm" onClick={() => verifyDoc(doc.id)}>
    <CheckCircle className="size-3.5 mr-1" /> Verify
  </Button>
  <Button variant="destructive" size="sm" onClick={() => openRejectDialog(doc.id)}>
    <XCircle className="size-3.5 mr-1" /> Reject
  </Button>
  <Button variant="outline" size="sm" onClick={() => flagFraud(doc.id)}>
    <Flag className="size-3.5 mr-1" /> Flag
  </Button>
</div>
```

Reject action opens a `Dialog` with a `Textarea` for required rejection reason.

---