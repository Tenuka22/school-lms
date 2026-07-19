"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface ChildData {
  full_name: string
  name_with_initials: string
  date_of_birth: string
  gender: string
  religion: string
  nationality: string
  birth_certificate_number: string
}

interface Props {
  data: ChildData
  onChange: (data: ChildData) => void
  onNext: () => void
}

export function WizardStepChild({ data, onChange, onNext }: Props) {
  const update = (partial: Partial<ChildData>) => onChange({ ...data, ...partial })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Child Profile</CardTitle>
        <CardDescription>Enter the child's personal details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" value={data.full_name} onChange={(e) => update({ full_name: e.target.value })} placeholder="Nimal Perera" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name_with_initials">Name with Initials</Label>
          <Input id="name_with_initials" value={data.name_with_initials} onChange={(e) => update({ name_with_initials: e.target.value })} placeholder="N. Perera" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input id="date_of_birth" type="date" value={data.date_of_birth} onChange={(e) => update({ date_of_birth: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={data.gender} onValueChange={(val) => val && update({ gender: val })}>
            <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality</Label>
          <Select value={data.nationality} onValueChange={(val) => val && update({ nationality: val })}>
            <SelectTrigger id="nationality"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SriLankan">Sri Lankan</SelectItem>
              <SelectItem value="DualCitizen">Dual Citizen</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="religion">Religion</Label>
          <Select value={data.religion} onValueChange={(val) => update({ religion: val ?? "" })}>
            <SelectTrigger id="religion"><SelectValue placeholder="Select (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Buddhism">Buddhism</SelectItem>
              <SelectItem value="Hinduism">Hinduism</SelectItem>
              <SelectItem value="Islam">Islam</SelectItem>
              <SelectItem value="Christianity">Christianity</SelectItem>
              <SelectItem value="Catholicism">Catholicism</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="birth_certificate_number">Birth Certificate Number</Label>
          <Input id="birth_certificate_number" value={data.birth_certificate_number} onChange={(e) => update({ birth_certificate_number: e.target.value })} placeholder="Optional" />
        </div>
        <div className="flex justify-end pt-4">
          <Button onClick={onNext} disabled={!data.full_name || !data.name_with_initials || !data.date_of_birth}>
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
