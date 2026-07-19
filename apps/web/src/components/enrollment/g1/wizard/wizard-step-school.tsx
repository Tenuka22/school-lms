"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface SchoolData {
  school_id: string
  school_name_si: string
  school_type: string
  category: string
  quota: number
}

interface Props {
  data: SchoolData
  onChange: (data: SchoolData) => void
  onBack: () => void
  onNext: () => void
}

export function WizardStepSchool({ data, onChange, onBack, onNext }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: School Selection</CardTitle>
        <CardDescription>Enter the school for admission.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>School Name</Label>
          <Input
            value={data.school_name_si}
            onChange={(e) =>
              onChange({ ...data, school_name_si: e.target.value, school_id: e.target.value })
            }
            placeholder="Enter school name"
          />
        </div>
        {data.school_name_si && (
          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="font-semibold">{data.school_name_si}</h4>
            <div className="flex gap-2">
              <Badge variant="outline">{data.school_type || "N/A"}</Badge>
              <Badge variant="outline">{data.category || "N/A"}</Badge>
              <Badge>Quota: {data.quota || "—"}</Badge>
            </div>
          </div>
        )}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onNext} disabled={!data.school_name_si}>Next</Button>
        </div>
      </CardContent>
    </Card>
  )
}
