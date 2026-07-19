"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface AddressData {
  line1: string
  line2: string
  city: string
  district: string
  province: string
  gs_division: string
  postal_code: string
  residence_type: string
  ownership_proof: string
  lat: number
  lon: number
  distance_km: number
  distance_band: string
}

interface Props {
  data: AddressData
  onChange: (data: AddressData) => void
  onBack: () => void
  onNext: () => void
}

export function WizardStepAddress({ data, onChange, onBack, onNext }: Props) {
  const update = (partial: Partial<AddressData>) => onChange({ ...data, ...partial })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Address & Proximity</CardTitle>
        <CardDescription>Enter the residence address for proximity scoring.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Address Line 1</Label>
          <Input value={data.line1} onChange={(e) => update({ line1: e.target.value })} placeholder="Street address" />
        </div>
        <div className="space-y-2">
          <Label>Address Line 2</Label>
          <Input value={data.line2} onChange={(e) => update({ line2: e.target.value })} placeholder="Optional" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={data.city} onChange={(e) => update({ city: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>District</Label>
            <Select value={data.district} onValueChange={(val) => val && update({ district: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Colombo">Colombo</SelectItem>
                <SelectItem value="Gampaha">Gampaha</SelectItem>
                <SelectItem value="Kalutara">Kalutara</SelectItem>
                <SelectItem value="Kandy">Kandy</SelectItem>
                <SelectItem value="Galle">Galle</SelectItem>
                <SelectItem value="Matara">Matara</SelectItem>
                <SelectItem value="Jaffna">Jaffna</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Province</Label>
            <Select value={data.province} onValueChange={(val) => val && update({ province: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Western">Western</SelectItem>
                <SelectItem value="Central">Central</SelectItem>
                <SelectItem value="Southern">Southern</SelectItem>
                <SelectItem value="Northern">Northern</SelectItem>
                <SelectItem value="Eastern">Eastern</SelectItem>
                <SelectItem value="NorthWestern">North Western</SelectItem>
                <SelectItem value="NorthCentral">North Central</SelectItem>
                <SelectItem value="Uva">Uva</SelectItem>
                <SelectItem value="Sabaragamuwa">Sabaragamuwa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>GS Division</Label>
            <Input value={data.gs_division} onChange={(e) => update({ gs_division: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Postal Code</Label>
          <Input value={data.postal_code} onChange={(e) => update({ postal_code: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Residence Type</Label>
            <Select value={data.residence_type} onValueChange={(val) => val && update({ residence_type: val })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Owned">Owned</SelectItem>
                <SelectItem value="Rented">Rented</SelectItem>
                <SelectItem value="Relative">Relative</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ownership Proof</Label>
            <Select value={data.ownership_proof} onValueChange={(val) => val && update({ ownership_proof: val })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Deed">Deed</SelectItem>
                <SelectItem value="Lease">Lease</SelectItem>
                <SelectItem value="GN_Certificate">GN Certificate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={onNext} disabled={!data.line1 || !data.city || !data.district}>Next</Button>
        </div>
      </CardContent>
    </Card>
  )
}
