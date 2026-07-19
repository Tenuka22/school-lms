"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { GuardianData } from "./wizard-shell"

interface Props {
  guardians: GuardianData[]
  onChange: (guardians: GuardianData[]) => void
  onBack: () => void
  onNext: () => void
}

function GuardianForm({
  data,
  index,
  onChange,
}: {
  data: GuardianData
  index: number
  onChange: (g: GuardianData) => void
}) {
  const u = (partial: Partial<GuardianData>) => onChange({ ...data, ...partial })

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h4 className="font-medium">Guardian {index + 1}</h4>
      <div className="space-y-2">
        <Label>Relationship</Label>
        <Select value={data.relationship} onValueChange={(val) => val && u({ relationship: val })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Father">Father</SelectItem>
            <SelectItem value="Mother">Mother</SelectItem>
            <SelectItem value="Guardian">Guardian</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Full Name</Label>
        <Input value={data.full_name} onChange={(e) => u({ full_name: e.target.value })} placeholder="Full name" />
      </div>
      <div className="space-y-2">
        <Label>NIC Number</Label>
        <Input value={data.nic} onChange={(e) => u({ nic: e.target.value })} placeholder="XXXXXXXXXXX" />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={data.phone} onChange={(e) => u({ phone: e.target.value })} placeholder="07XXXXXXXX" />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={data.email} onChange={(e) => u({ email: e.target.value })} placeholder="Optional" />
      </div>
      <div className="space-y-2">
        <Label>Occupation</Label>
        <Input value={data.occupation} onChange={(e) => u({ occupation: e.target.value })} placeholder="Optional" />
      </div>
      <div className="space-y-2">
        <Label>Workplace</Label>
        <Input value={data.workplace} onChange={(e) => u({ workplace: e.target.value })} placeholder="Optional" />
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Scoring Categories</p>
        <div className="flex items-center gap-2">
          <Checkbox id={`is_staff_${index}`} checked={data.is_staff} onCheckedChange={(v) => u({ is_staff: v === true })} />
          <Label htmlFor={`is_staff_${index}`}>School Staff (25%)</Label>
        </div>
        {data.is_staff && (
          <div className="ml-6 space-y-2 border-l-2 pl-4">
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input value={data.staff_designation} onChange={(e) => u({ staff_designation: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select value={data.staff_employment_type} onValueChange={(val) => val && u({ staff_employment_type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permanent">Permanent</SelectItem>
                  <SelectItem value="Temporary">Temporary</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service Start Date</Label>
              <Input type="date" value={data.staff_service_start} onChange={(e) => u({ staff_service_start: e.target.value })} />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Checkbox id={`is_alumni_${index}`} checked={data.is_alumni} onCheckedChange={(v) => u({ is_alumni: v === true })} />
          <Label htmlFor={`is_alumni_${index}`}>Past Pupil / Alumni (6%)</Label>
        </div>
        {data.is_alumni && (
          <div className="ml-6 space-y-2 border-l-2 pl-4">
            <div className="space-y-2">
              <Label>Highest Grade</Label>
              <Select value={data.alumni_highest_grade} onValueChange={(val) => val && u({ alumni_highest_grade: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GCE_AL">GCE A/L</SelectItem>
                  <SelectItem value="GCE_OL">GCE O/L</SelectItem>
                  <SelectItem value="Grade_11">Grade 11</SelectItem>
                  <SelectItem value="Grade_10">Grade 10</SelectItem>
                  <SelectItem value="Below">Below Grade 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year Left</Label>
              <Input value={data.alumni_year_left} onChange={(e) => u({ alumni_year_left: e.target.value })} placeholder="YYYY" />
            </div>
            <div className="space-y-2">
              <Label>Left Reason</Label>
              <Select value={data.alumni_left_reason} onValueChange={(val) => val && u({ alumni_left_reason: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Transferred">Transferred</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Checkbox id={`is_govt_${index}`} checked={data.is_govt_employee} onCheckedChange={(v) => u({ is_govt_employee: v === true })} />
          <Label htmlFor={`is_govt_${index}`}>Government Employee (4%)</Label>
        </div>
        {data.is_govt_employee && (
          <div className="ml-6 space-y-2 border-l-2 pl-4">
            <div className="space-y-2">
              <Label>Service Years</Label>
              <Input type="number" value={data.govt_service_years} onChange={(e) => u({ govt_service_years: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Checkbox id={`is_special_${index}`} checked={data.is_special} onCheckedChange={(v) => u({ is_special: v === true })} />
          <Label htmlFor={`is_special_${index}`}>Special Circumstances (1%)</Label>
        </div>
        {data.is_special && (
          <div className="ml-6 space-y-2 border-l-2 pl-4">
            <div className="flex items-center gap-2">
              <Checkbox id={`disability_${index}`} checked={data.disability} onCheckedChange={(v) => u({ disability: v === true })} />
              <Label htmlFor={`disability_${index}`}>Disability</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id={`conflict_${index}`} checked={data.conflict_area} onCheckedChange={(v) => u({ conflict_area: v === true })} />
              <Label htmlFor={`conflict_${index}`}>Conflict Area</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id={`single_parent_${index}`} checked={data.single_parent} onCheckedChange={(v) => u({ single_parent: v === true })} />
              <Label htmlFor={`single_parent_${index}`}>Single Parent</Label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function WizardStepGuardian({ guardians, onChange, onBack, onNext }: Props) {
  const updateGuardian = (index: number, data: GuardianData) => {
    const next = [...guardians]
    next[index] = data
    onChange(next)
  }

  const addGuardian = () => {
    if (guardians.length >= 2) return
    onChange([
      ...guardians,
      {
        tempId: crypto.randomUUID(),
        relationship: "Mother",
        full_name: "",
        nic: "",
        phone: "",
        email: "",
        occupation: "",
        workplace: "",
        workplace_address: "",
        income: "",
        is_staff: false,
        staff_designation: "",
        staff_employment_type: "Permanent",
        staff_service_start: "",
        is_alumni: false,
        alumni_highest_grade: "",
        alumni_year_left: "",
        alumni_left_reason: "",
        is_govt_employee: false,
        govt_service_years: 0,
        is_special: false,
        disability: false,
        conflict_area: false,
        single_parent: false,
      },
    ])
  }

  const hasPrimaryName = guardians[0]?.full_name.trim().length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Guardian Profile</CardTitle>
        <CardDescription>Add guardian details and declare scoring categories.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {guardians.map((g, i) => (
          <GuardianForm key={g.tempId} data={g} index={i} onChange={(d) => updateGuardian(i, d)} />
        ))}
        {guardians.length < 2 && (
          <Button variant="outline" onClick={addGuardian}>Add Guardian</Button>
        )}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onNext} disabled={!hasPrimaryName}>Next</Button>
        </div>
      </CardContent>
    </Card>
  )
}
