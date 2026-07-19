"use client"

import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState, useRef } from "react"
import { Plus, FolderPlus, CircleCheck, CircleX, Clock } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { listApplicationsOptions, listApplicationsQueryKey, listBatchesOptions, listBatchesQueryKey } from "@/lib/api-client/@tanstack/react-query.gen"
import { createApplication, createBatch } from "@/lib/api-client/sdk.gen"
import { queryClient } from "@/router"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PipelineCard } from "./pipeline-card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { G1Application } from "@/lib/api-client/types.gen"

const WEIGHT_INFO: Record<string, { label: string; desc: string }> = {
  proximity: { label: "Proximity", desc: "Priority for children living closest to the school" },
  staff: { label: "Staff", desc: "Children of staff members employed at the school" },
  sibling: { label: "Sibling", desc: "Children with siblings already enrolled at the school" },
  alumni: { label: "Alumni", desc: "Children of former graduates of the school" },
  govt: { label: "Govt", desc: "Children of government employees transferred to the area" },
  special: { label: "Special", desc: "Children with special needs or exceptional circumstances" },
}

interface LaneConfig {
  status: string
  label: string
  badgeVariant: "secondary" | "default" | "destructive"
}

const LANE_CONFIG: LaneConfig[] = [
  { status: "Pending", label: "Pending", badgeVariant: "secondary" },
  { status: "ProvisionallyApproved", label: "Completed", badgeVariant: "default" },
  { status: "Approved", label: "Approved", badgeVariant: "default" },
  { status: "Rejected", label: "Rejected", badgeVariant: "destructive" },
]

export function PipeDashboard() {
  const navigate = useNavigate()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [batchId, setBatchId] = useState("")
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [newFullName, setNewFullName] = useState("")
  const [batchDialogOpen, setBatchDialogOpen] = useState(false)
  const [batchYear, setBatchYear] = useState(String(new Date().getFullYear()))
  const [batchAllocation, setBatchAllocation] = useState("200")
  const [batchProximity, setBatchProximity] = useState("50")
  const [batchStaff, setBatchStaff] = useState("25")
  const [batchSibling, setBatchSibling] = useState("14")
  const [batchAlumni, setBatchAlumni] = useState("6")
  const [batchGovt, setBatchGovt] = useState("4")
  const [batchSpecial, setBatchSpecial] = useState("1")

  const { data: batches } = useQuery({
    ...listBatchesOptions({ client: apiClient }),
  })

  const { data: enrollments } = useQuery({
    ...listApplicationsOptions({ client: apiClient, query: { page_size: 1000 } }),
    enabled: !!batchId,
  })

  const items = ((enrollments as any)?.items ?? []) as G1Application[]

  const grouped = LANE_CONFIG.reduce<Record<string, G1Application[]>>((acc, lane) => {
    acc[lane.status] = items.filter((e) => e.enrollment_status === lane.status)
    return acc
  }, {})

  const handleCreate = async () => {
    if (!newFullName.trim() || !batchId) return
    const { data, error } = await createApplication({
      body: {
        full_name: newFullName,
        name_with_initials: newFullName,
        date_of_birth: "2000-01-01",
        gender: "Male",
        nationality: "SriLankan",
        category: "CloseResident",
        medium_of_instruction: "Sinhala",
        batch_id: batchId,
        reference_no: `REF-${Date.now()}`,
      },
      client: apiClient,
    })
    if (error || !data) {
      toast.error((error as any)?.message ?? "Failed to create enrollment")
      return
    }
    toast.success("Enrollment created. Complete all details.")
    setNewDialogOpen(false)
    setNewFullName("")
    queryClient.invalidateQueries({ queryKey: listApplicationsQueryKey({ client: apiClient }) })
    navigate({ to: "/student-management/enrollment/g1/$enrollment-id", params: { "enrollment-id": data.id! } })
  }

  const handleCreateBatch = async () => {
    const year = parseInt(batchYear, 10)
    if (isNaN(year) || year < 2000 || year > 2100) return
    const toNum = (s: string) => { const n = parseFloat(s); return isNaN(n) ? null : n }
    try {
      const r = await createBatch({
        body: {
          enrollment_type: "G1",
          year,
          student_allocation: toNum(batchAllocation),
          proximity_weight: toNum(batchProximity),
          staff_weight: toNum(batchStaff),
          sibling_weight: toNum(batchSibling),
          alumni_weight: toNum(batchAlumni),
          govt_weight: toNum(batchGovt),
          special_weight: toNum(batchSpecial),
        },
        client: apiClient,
      })
      const newBatchId = (r as any).id ?? (r as any).data?.id
      toast.success("Batch created")
      setBatchDialogOpen(false)
      setBatchYear(String(new Date().getFullYear()))
      await queryClient.invalidateQueries({ queryKey: listBatchesQueryKey({ client: apiClient }) })
      if (newBatchId) setBatchId(newBatchId)
    } catch {
      toast.error("Failed to create batch")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Grade 1 Admissions Pipeline</h1>
        <Button onClick={() => setNewDialogOpen(true)} disabled={!batchId}>
          <Plus className="size-4 mr-2" /> New Enrollment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {LANE_CONFIG.map((lane) => {
          const laneItems = grouped[lane.status] ?? []
          return (
            <div key={lane.status} className="bg-muted/50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{lane.label}</h3>
                <Badge variant={lane.badgeVariant}>{laneItems.length}</Badge>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {laneItems.map((enr: any) => (
                  <PipelineCard
                    key={enr.id}
                    enrollment={enr}
                    laneStatus={lane.status}
                    onClick={() =>
                      navigate({
                        to: "/student-management/enrollment/g1/$enrollment-id",
                        params: { "enrollment-id": enr.id! },
                      })
                    }
                  />
                ))}
                {laneItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No enrollments</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground px-0.5">Batch</Label>
        <ScrollArea className="w-full">
          <div ref={scrollRef} className="flex gap-2 min-w-max pb-1">
            {(batches ?? []).map((b) => {
              const isActive = b.id === batchId
              const year = b.year
              const total = b.student_allocation ?? 0
              const status = b.status ?? "Open"
              const StatusIcon = status === "Open" ? CircleCheck : status === "Closed" ? CircleX : Clock
              const statusLabel = status === "Open" ? "Accepting enrollments" : status === "Closed" ? "Closed" : "Archived"
              const miniWeights = [
                { key: "proximity", value: String(b.proximity_weight ?? 50), color: "bg-blue-500" },
                { key: "staff", value: String(b.staff_weight ?? 25), color: "bg-emerald-500" },
                { key: "sibling", value: String(b.sibling_weight ?? 14), color: "bg-violet-500" },
                { key: "alumni", value: String(b.alumni_weight ?? 6), color: "bg-amber-500" },
                { key: "govt", value: String(b.govt_weight ?? 4), color: "bg-rose-500" },
                { key: "special", value: String(b.special_weight ?? 1), color: "bg-cyan-500" },
              ]
              const miniTotalW = miniWeights.reduce((s, w) => s + (parseInt(w.value) || 0), 0)
              const miniSegments = miniWeights.filter((w) => (parseInt(w.value) || 0) > 0)
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setBatchId(b.id!)
                    b.id && scrollRef.current?.querySelector(`[data-batch-id="${b.id}"]`)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })
                  }}
                  className={`flex items-start gap-3 rounded-xl border px-5 py-3 text-left transition-all min-w-52 shrink-0 ${
                    isActive
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border hover:border-primary/40 hover:bg-accent/40"
                  }`}
                  data-batch-id={b.id}
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold">{year}</span>
                      <Tooltip>
                        <TooltipTrigger className="shrink-0">
                          <StatusIcon className={`size-4 ${status === "Open" ? "text-green-600" : status === "Closed" ? "text-muted-foreground" : "text-amber-500"}`} />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>{statusLabel}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{total} seats</div>
                    <div className="flex h-3 w-full rounded-full overflow-hidden">
                      {miniSegments.map((w) => {
                        const pct = (parseInt(w.value) || 0) / miniTotalW
                        return <div key={w.key} className={`${w.color}`} style={{ width: `${pct * 100}%` }} />
                      })}
                    </div>
                  </div>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setBatchDialogOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-dashed border-border px-5 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-all min-w-52 shrink-0 justify-center"
            >
              <FolderPlus className="size-5" />
              New Batch
            </button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Batch</DialogTitle>
            <DialogDescription>Set up a new G1 admission batch with allocation and scoring weights.</DialogDescription>
          </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="batch-year">Year</Label>
              <Input id="batch-year" value={batchYear} onChange={(e) => setBatchYear(e.target.value)} placeholder="2026" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-allocation">Total Student Allocation</Label>
              <Input id="batch-allocation" type="number" value={batchAllocation} onChange={(e) => setBatchAllocation(e.target.value)} />
            </div>

            <div className="space-y-3">
              <Label>Weight Distribution</Label>

              <WeightBar
                weights={[
                  { key: "proximity", value: batchProximity, color: "bg-blue-500" },
                  { key: "staff", value: batchStaff, color: "bg-emerald-500" },
                  { key: "sibling", value: batchSibling, color: "bg-violet-500" },
                  { key: "alumni", value: batchAlumni, color: "bg-amber-500" },
                  { key: "govt", value: batchGovt, color: "bg-rose-500" },
                  { key: "special", value: batchSpecial, color: "bg-cyan-500" },
                ]}
                totalAllocation={parseInt(batchAllocation) || 0}
              />

              <div className="space-y-1.5">
                {([
                  { key: "proximity", value: batchProximity, setter: setBatchProximity, color: "bg-blue-500" },
                  { key: "staff", value: batchStaff, setter: setBatchStaff, color: "bg-emerald-500" },
                  { key: "sibling", value: batchSibling, setter: setBatchSibling, color: "bg-violet-500" },
                  { key: "alumni", value: batchAlumni, setter: setBatchAlumni, color: "bg-amber-500" },
                  { key: "govt", value: batchGovt, setter: setBatchGovt, color: "bg-rose-500" },
                  { key: "special", value: batchSpecial, setter: setBatchSpecial, color: "bg-cyan-500" },
                ] as const).map((w) => {
                  const info = WEIGHT_INFO[w.key]
                  const weight = parseInt(w.value) || 0
                  const totalWeight = [batchProximity, batchStaff, batchSibling, batchAlumni, batchGovt, batchSpecial]
                    .reduce((s, v) => s + (parseInt(v) || 0), 0)
                  const pct = totalWeight > 0 ? (weight / totalWeight * 100).toFixed(0) : "0"
                  const seats = totalWeight > 0 ? Math.round((weight / totalWeight) * (parseInt(batchAllocation) || 0)) : 0
                  return (
                    <Tooltip key={w.key}>
                      <TooltipTrigger render={<div className="flex items-center gap-2 cursor-help" />}>
                        <div className={`size-3 rounded-full shrink-0 ${w.color}`} />
                        <span className="text-xs w-14 text-muted-foreground">{info.label}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="size-6 rounded border border-input flex items-center justify-center text-xs hover:bg-accent disabled:opacity-30"
                            disabled={weight <= 0}
                            onClick={(e) => { e.stopPropagation(); w.setter(String(Math.max(0, weight - 1))) }}
                          >−</button>
                          <span className="w-8 text-center text-sm font-mono tabular-nums">{weight}</span>
                          <button
                            type="button"
                            className="size-6 rounded border border-input flex items-center justify-center text-xs hover:bg-accent"
                            onClick={(e) => { e.stopPropagation(); w.setter(String(weight + 1)) }}
                          >+</button>
                        </div>
                        <div className="flex-1" />
                        <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                        <span className="text-xs font-medium tabular-nums w-16 text-right">{seats} seats</span>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-64">
                        <p className="font-medium">{info.label}</p>
                        <p className="text-[11px] opacity-80">{info.desc}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBatch} disabled={!batchYear.trim()}>Create Batch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Enrollment</DialogTitle>
            <DialogDescription>Enter the child's full name to create a PENDING enrollment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="Child's full name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newFullName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface WeightItem {
  key: string
  value: string
  color: string
}

function WeightBar({ weights, totalAllocation }: { weights: WeightItem[]; totalAllocation: number }) {
  const totalWeight = weights.reduce((s, w) => s + (parseInt(w.value) || 0), 0)
  const segments = weights.filter((w) => (parseInt(w.value) || 0) > 0)

  return (
    <div className="space-y-2">
      <div className="flex h-8 w-full rounded-md overflow-hidden border">
        {segments.length === 0 ? (
          <div className="flex-1 bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
            No weights set
          </div>
        ) : (
          segments.map((w) => {
            const info = WEIGHT_INFO[w.key]
            const pct = (parseInt(w.value) || 0) / totalWeight
            const seats = totalWeight > 0 ? Math.round(pct * totalAllocation) : 0
            return (
              <Tooltip key={w.key}>
                <TooltipTrigger
                  className={`${w.color} flex items-center justify-center text-[10px] text-white font-medium truncate px-0.5 transition-all cursor-help`}
                  style={{ width: `${pct * 100}%` }}
                >
                  {pct > 0.08 ? `${(pct * 100).toFixed(0)}%` : ""}
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="font-medium">{info.label}</p>
                  <p className="text-[11px] opacity-80">{info.desc}</p>
                  <p className="text-[11px] mt-1 opacity-70">{w.value} pts — {seats} seats</p>
                </TooltipContent>
              </Tooltip>
            )
          })
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((w) => {
          const info = WEIGHT_INFO[w.key]
          const pct = (parseInt(w.value) || 0) / totalWeight
          const seats = totalWeight > 0 ? Math.round(pct * totalAllocation) : 0
          return (
            <Tooltip key={w.key}>
              <TooltipTrigger className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-help">
                <div className={`size-2 rounded-full ${w.color}`} />
                <span>{info.label}</span>
                <span className="font-medium tabular-nums">{seats}</span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{info.label}</p>
                <p className="text-[11px] opacity-80">{info.desc}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
