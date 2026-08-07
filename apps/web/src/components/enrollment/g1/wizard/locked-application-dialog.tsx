"use client"

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
import { IconLock } from "@tabler/icons-react"

interface LockedApplicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOverride?: () => void
  isAdmin?: boolean
}

export function LockedApplicationDialog({
  open,
  onOpenChange,
  onOverride,
  isAdmin = false,
}: LockedApplicationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <IconLock className="size-5 text-amber-500" />
            Application Locked
          </AlertDialogTitle>
          <AlertDialogDescription>
            This application has been submitted and is now locked. Editing is restricted to prevent
            unauthorized changes that could affect the enrollment process.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Why is this locked?</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li>The application has been submitted for review</li>
            <li>Changes may affect enrollment eligibility</li>
            <li>All modifications are logged for audit purposes</li>
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          {isAdmin && onOverride && (
            <AlertDialogAction
              onClick={onOverride}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Override Lock (Admin)
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
