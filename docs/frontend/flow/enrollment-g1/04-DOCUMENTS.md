# Document Management

## Location

Documents are managed within the **Enrollment Wizard, Step 5** (not a separate page).

> Route: `/_authenticated/student-management/enrollment/g1/$enrollment_id` → Step 5
> Component: `apps/web/src/components/enrollment/g1/wizard/wizard-step-documents.tsx`

---

## Entity Connection

```
g1_applications ──► g1_documents (one-to-many)
                         │
                         ├── doc_type: string
                         ├── file_url: string (MinIO presigned URL)
                         ├── file_key: string (MinIO object key)
                         ├── file_hash: string (SHA-256)
                         ├── file_size: bigint
                         ├── content_type: string
                         └── created_at / updated_at
```

---

## Document Upload in Wizard

### Step 5: Documents

The wizard step renders document upload cards with:
- Drop zone for file upload
- Document type selector
- File preview after upload
- Upload status (uploaded / missing)

### Upload Flow

1. User selects document type from a dropdown.
2. User drags & drops or browses for a file.
3. File is uploaded to MinIO via the API.
4. On success, the document is tracked locally with `status: "uploaded"`, `file_url`, `file_key`, `file_name`, `content_type`, `file_size`.
5. On save, all uploaded documents are sent to the server via `saveApplicationDocumentsMutation`.

### Data Saved

```ts
body: {
  documents: Array<{
    doc_type: string
    file_url: string
    file_key: string
    content_type: string | null
    file_size: bigint | null
  }>
}
```

### Post-Submission

After the wizard is completed, documents can be viewed in the application detail page (when implemented). Currently, documents are only accessible through the wizard.

---

## Not Yet Implemented

The following document management features are planned but not yet built:

- **Separate document review page** at `/applications/$id/documents` with verification badges
- **Document verification actions** (Verify / Reject / Flag for fraud) for officers
- **Fraud detection indicators** (duplicate hash detection, fraud flags)
- **Bulk upload** capability
- **Document download** from the pipeline dashboard
- **Verification status** enum (`Pending`, `Verified`, `Rejected`, `Flagged`)
- **Verified by / verified_at** tracking


---