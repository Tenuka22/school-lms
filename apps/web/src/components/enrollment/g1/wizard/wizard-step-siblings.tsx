"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import type { SiblingData } from "./wizard-shell"

interface Props {
  siblings: SiblingData[]
  onChange: (siblings: SiblingData[]) => void
  onBack: () => void
  onNext: () => void
}

export function WizardStepSiblings({ siblings, onChange, onBack, onNext }: Props) {
  const update = (index: number, data: SiblingData) => {
    const next = [...siblings]
    next[index] = data
    onChange(next)
  }

  const add = () => {
    onChange([
      ...siblings,
      {
        tempId: crypto.randomUUID(),
        sibling_name: "",
        current_grade: 1,
        admission_year: "",
      },
    ])
  }

  const remove = (index: number) => {
    onChange(siblings.filter((_, i) => i !== index))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 5: Sibling Details</CardTitle>
        <CardDescription>Add siblings currently studying at the selected school.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {siblings.length === 0 && (
          <p className="text-sm text-muted-foreground">No siblings added yet.</p>
        )}
        {siblings.map((s, i) => (
          <div key={s.tempId} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Sibling {i + 1}</h4>
              <Button variant="ghost" size="sm" onClick={() => remove(i)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={s.sibling_name}
                onChange={(e) => update(i, { ...s, sibling_name: e.target.value })}
                placeholder="Sibling's full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Grade</Label>
                <Input
                  type="number"
                  min={1}
                  max={13}
                  value={s.current_grade}
                  onChange={(e) => update(i, { ...s, current_grade: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Admission Year</Label>
                <Input
                  value={s.admission_year}
                  onChange={(e) => update(i, { ...s, admission_year: e.target.value })}
                  placeholder="YYYY"
                />
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={add}>
          <Plus className="size-4 mr-2" /> Add Sibling
        </Button>
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onNext}>Next</Button>
        </div>
      </CardContent>
    </Card>
  )
}
