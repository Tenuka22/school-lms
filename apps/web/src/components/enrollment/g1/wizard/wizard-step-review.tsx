"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import type { WizardState } from "./wizard-shell"

interface Props {
  state: WizardState
  onBack: () => void
  onComplete: () => void
}

export function WizardStepReview({ state, onBack, onComplete }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 7: Review & Lock</CardTitle>
          <CardDescription>Review all entered information before completing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-sm mb-2">Child Profile</h3>
            <div className="border rounded-lg p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {state.child.full_name}</p>
              <p><span className="text-muted-foreground">Initials:</span> {state.child.name_with_initials}</p>
              <p><span className="text-muted-foreground">DOB:</span> {state.child.date_of_birth}</p>
              <p><span className="text-muted-foreground">Gender:</span> {state.child.gender}</p>
              <p><span className="text-muted-foreground">Nationality:</span> {state.child.nationality}</p>
              {state.child.religion && <p><span className="text-muted-foreground">Religion:</span> {state.child.religion}</p>}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Guardians</h3>
            {state.guardians.map((g) => (
              <div key={g.tempId} className="border rounded-lg p-3 space-y-1 text-sm mb-2">
                <p><span className="text-muted-foreground">Name:</span> {g.full_name}</p>
                <p><span className="text-muted-foreground">Relationship:</span> {g.relationship}</p>
                <p><span className="text-muted-foreground">NIC:</span> {g.nic}</p>
                <p><span className="text-muted-foreground">Phone:</span> {g.phone}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {g.is_staff && <Badge variant="secondary">Staff</Badge>}
                  {g.is_alumni && <Badge variant="secondary">Alumni</Badge>}
                  {g.is_govt_employee && <Badge variant="secondary">Govt Employee</Badge>}
                  {g.is_special && <Badge variant="secondary">Special</Badge>}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">School</h3>
            <div className="border rounded-lg p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">School:</span> {state.school.school_name_si || "Not selected"}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Address</h3>
            <div className="border rounded-lg p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Address:</span> {state.address.line1}, {state.address.city}</p>
              <p><span className="text-muted-foreground">District:</span> {state.address.district}</p>
            </div>
          </div>

          {state.siblings.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Siblings</h3>
              {state.siblings.map((s) => (
                <div key={s.tempId} className="border rounded-lg p-3 space-y-1 text-sm mb-2">
                  <p><span className="text-muted-foreground">Name:</span> {s.sibling_name}</p>
                  <p><span className="text-muted-foreground">Grade:</span> {s.current_grade}</p>
                </div>
              ))}
            </div>
          )}

          <div>
            <h3 className="font-semibold text-sm mb-2">Documents</h3>
            <div className="border rounded-lg p-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Uploaded:</span> {state.documents.filter((d) => d.status === "uploaded").length} files</p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>Back</Button>
            <AlertDialog>
              <AlertDialogTrigger render={<Button>Confirm &amp; Complete</Button>} />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Complete Enrollment</AlertDialogTitle>
                  <AlertDialogDescription>
                    After completing, this enrollment cannot be edited. Are you sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onComplete}>Complete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
