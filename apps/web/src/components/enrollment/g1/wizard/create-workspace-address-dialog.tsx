"use client"

import { EntityDialog } from "@/lib/form-builder"
import {
  workspaceAddressFormConfig,
  workspaceAddressFormDefaults,
} from "@/components/forms/workspace-address-form"
import type { CreateWorkspaceAddressBody } from "@/lib/api-client/types.gen"

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
      config={workspaceAddressFormConfig}
      defaultValues={workspaceAddressFormDefaults}
      onSubmit={onSubmit}
      submitting={isPending}
      actionLabel="Create Address"
      size="md"
    />
  )
}
