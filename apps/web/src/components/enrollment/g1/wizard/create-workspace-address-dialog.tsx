"use client"

import { EntityDialog, type FormConfig } from "@/lib/form-builder"
import type { CreateWorkspaceAddressBody } from "@/lib/api-client/types.gen"

const workspaceAddressConfig: FormConfig<CreateWorkspaceAddressBody> = {
  fields: [
    { name: "name", kind: "text", label: "Label", required: true, placeholder: "e.g. Main Office, Home" },
    { name: "street_1", kind: "text", label: "Street Address", required: true, placeholder: "e.g. 123 Main Street" },
    { name: "building", kind: "text", label: "Building / Unit", placeholder: "e.g. Block A, Apt 4B" },
    { name: "street_2", kind: "text", label: "Street Line 2", placeholder: "e.g. Near City Park" },
    { name: "city", kind: "text", label: "City", required: true, placeholder: "e.g. Colombo" },
    { name: "state", kind: "text", label: "State / Province", placeholder: "e.g. Western Province" },
    { name: "postal_code", kind: "text", label: "Postal Code", placeholder: "e.g. 00100" },
    { name: "country", kind: "text", label: "Country", required: true, placeholder: "e.g. Sri Lanka" },
  ],
  layout: [
    { columns: [{ fields: ["name"], span: 12 }] },
    { columns: [{ fields: ["street_1"], span: 12 }] },
    {
      columns: [
        { fields: ["building"], span: 6 },
        { fields: ["street_2"], span: 6 },
      ],
    },
    {
      columns: [
        { fields: ["city"], span: 6 },
        { fields: ["state"], span: 6 },
      ],
    },
    {
      columns: [
        { fields: ["postal_code"], span: 6 },
        { fields: ["country"], span: 6 },
      ],
    },
  ],
  submitLabel: "Create Address",
}

const workspaceAddressDefaults: CreateWorkspaceAddressBody = {
  name: "",
  building: "",
  street_1: "",
  street_2: "",
  city: "Galle",
  state: "",
  postal_code: "",
  country: "Sri Lanka",
}

interface CreateWorkspaceAddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateWorkspaceAddressBody) => Promise<void>
  isPending: boolean
}

export function CreateWorkspaceAddressDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: CreateWorkspaceAddressDialogProps) {
  return (
    <EntityDialog<CreateWorkspaceAddressBody>
      open={open}
      onOpenChange={onOpenChange}
      title="New Workspace Address"
      config={workspaceAddressConfig}
      defaultValues={workspaceAddressDefaults}
      onSubmit={onSubmit}
      submitting={isPending}
      actionLabel="Create Address"
      size="md"
    />
  )
}
