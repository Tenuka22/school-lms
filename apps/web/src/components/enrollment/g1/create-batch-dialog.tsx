"use client"

import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { createBatch } from "@/lib/api-client/sdk.gen"
import { vCreateBatchBody } from "@/lib/api-client/valibot.gen"
import type { CreateBatchBody, EnrollmentBatch } from "@/lib/api-client/types.gen"
import { EntityDialog } from "@/lib/form-builder"
import type { FormConfig } from "@/lib/form-builder"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  FieldLabel,
} from "@/components/ui/field"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { useBuildForm } from "@/lib/form-builder/form-context"

const WEIGHT_INFO: Record<string, { label: string; desc: string }> = {
  proximity: {
    label: "Proximity",
    desc: "Priority for children living closest to the school",
  },
  staff: {
    label: "Staff",
    desc: "Children of staff members employed at the school",
  },
  sibling: {
    label: "Sibling",
    desc: "Children with siblings already enrolled at the school",
  },
  alumni: {
    label: "Alumni",
    desc: "Children of former graduates of the school",
  },
  govt: {
    label: "Govt",
    desc: "Children of government employees transferred to the area",
  },
  special: {
    label: "Special",
    desc: "Children with special needs or exceptional circumstances",
  },
}

const RELIGION_INFO: Record<string, { label: string; desc: string }> = {
  buddhism: {
    label: "Buddhist",
    desc: "Percentage allocation for Buddhist students",
  },
  catholicism: {
    label: "Catholic",
    desc: "Percentage allocation for Catholic students",
  },
  islam: {
    label: "Islam",
    desc: "Percentage allocation for Muslim students",
  },
  hinduism: {
    label: "Hindu",
    desc: "Percentage allocation for Hindu students",
  },
}

function WeightBar({
  weights,
  totalAllocation,
}: {
  weights: { key: string; value: string; color: string }[]
  totalAllocation: number
}) {
  const totalWeight = weights.reduce((s, w) => s + (parseInt(w.value) || 0), 0)
  const segments = weights.filter((w) => (parseInt(w.value) || 0) > 0)

  return (
    <div className="space-y-2">
      <div className="flex h-8 w-full overflow-hidden rounded-md border">
        {segments.length === 0 ? (
          <div className="flex flex-1 items-center justify-center bg-muted text-[10px] text-muted-foreground">
            No weights set
          </div>
        ) : (
          segments.map((w) => {
            const info = WEIGHT_INFO[w.key]
            const pct = (parseInt(w.value) || 0) / totalWeight
            const seats =
              totalWeight > 0 ? Math.round(pct * totalAllocation) : 0
            return (
              <Tooltip key={w.key}>
                <TooltipTrigger
                  className={`${w.color} flex cursor-help items-center justify-center truncate px-0.5 text-[10px] font-medium text-white transition-all`}
                  style={{ width: `${pct * 100}%` }}
                >
                  {pct > 0.08 ? `${(pct * 100).toFixed(0)}%` : ""}
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="font-medium">{info.label}</p>
                  <p className="text-[11px] opacity-80">{info.desc}</p>
                  <p className="mt-1 text-[11px] opacity-70">
                    {w.value} pts — {seats} seats
                  </p>
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
              <TooltipTrigger className="flex cursor-help items-center gap-1 text-[10px] text-muted-foreground">
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

function ScoreDistributionSection() {
  const form = useBuildForm()

  const percentageFields = [
    { name: "proximity_percentage", label: "Proximity", color: "bg-blue-500" },
    { name: "staff_percentage", label: "Staff", color: "bg-emerald-500" },
    { name: "sibling_percentage", label: "Sibling", color: "bg-violet-500" },
    { name: "alumni_percentage", label: "Alumni", color: "bg-amber-500" },
    { name: "govt_percentage", label: "Govt", color: "bg-rose-500" },
    { name: "special_percentage", label: "Special", color: "bg-cyan-500" },
  ] as const

  return (
    <div className="space-y-4">
      <FieldLabel>Score Distribution</FieldLabel>

      <form.Subscribe
        selector={(s: any) => {
          const v = s.values
          return {
            values: [
              { key: "proximity", value: String(v.proximity_percentage ?? 0), color: "bg-blue-500" },
              { key: "staff", value: String(v.staff_percentage ?? 0), color: "bg-emerald-500" },
              { key: "sibling", value: String(v.sibling_percentage ?? 0), color: "bg-violet-500" },
              { key: "alumni", value: String(v.alumni_percentage ?? 0), color: "bg-amber-500" },
              { key: "govt", value: String(v.govt_percentage ?? 0), color: "bg-rose-500" },
              { key: "special", value: String(v.special_percentage ?? 0), color: "bg-cyan-500" },
            ],
            allocation: v.student_allocation ?? 200,
          }
        }}
        children={({ values, allocation }: any) => (
          <WeightBar weights={values} totalAllocation={allocation} />
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        {percentageFields.map((p) => (
          <form.Field
            key={p.name}
            name={p.name}
            children={(field: any) => {
              const value = field.state.value as number
              return (
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor={field.name}>
                    {p.label}
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <Slider
                      id={field.name}
                      value={[value]}
                      onValueChange={(v) =>
                        field.handleChange(
                          Math.round(Array.isArray(v) ? v[0] : v)
                        )
                      }
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) =>
                        field.handleChange(
                          Math.min(100, Math.max(0, Number(e.target.value) || 0))
                        )
                      }
                      className="w-16 text-center tabular-nums"
                    />
                  </div>
                </div>
              )
            }}
          />
        ))}
        <form.Subscribe
          selector={(s: any) => {
            const v = s.values
            return (v.proximity_percentage ?? 0) + (v.staff_percentage ?? 0) +
              (v.sibling_percentage ?? 0) + (v.alumni_percentage ?? 0) +
              (v.govt_percentage ?? 0) + (v.special_percentage ?? 0)
          }}
          children={(total: number) => (
            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className={`tabular-nums font-medium ${total !== 100 ? "text-destructive" : "text-green-600"}`}>
                {total}%
              </span>
            </div>
          )}
        />
      </div>
    </div>
  )
}

function ReligionDistributionSection() {
  const form = useBuildForm()

  const religionFields = [
    { name: "buddhism_percentage", label: "Buddhist", color: "bg-amber-600" },
    { name: "catholicism_percentage", label: "Catholic", color: "bg-purple-600" },
    { name: "islam_percentage", label: "Islam", color: "bg-emerald-600" },
    { name: "hinduism_percentage", label: "Hindu", color: "bg-orange-600" },
  ] as const

  return (
    <div className="space-y-4">
      <FieldLabel>Religion Quota Distribution</FieldLabel>

      <div className="grid grid-cols-2 gap-3">
        {religionFields.map((p) => (
          <form.Field
            key={p.name}
            name={p.name}
            children={(field: any) => {
              const value = field.state.value as number
              return (
                <div className="flex flex-col gap-1">
                  <FieldLabel htmlFor={field.name}>
                    {p.label}
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <Slider
                      id={field.name}
                      value={[value]}
                      onValueChange={(v) =>
                        field.handleChange(
                          Math.round(Array.isArray(v) ? v[0] : v)
                        )
                      }
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) =>
                        field.handleChange(
                          Math.min(100, Math.max(0, Number(e.target.value) || 0))
                        )
                      }
                      className="w-16 text-center tabular-nums"
                    />
                  </div>
                </div>
              )
            }}
          />
        ))}
        <form.Subscribe
          selector={(s: any) => {
            const v = s.values
            return (v.buddhism_percentage ?? 0) + (v.catholicism_percentage ?? 0) +
              (v.islam_percentage ?? 0) + (v.hinduism_percentage ?? 0)
          }}
          children={(total: number) => (
            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className={`tabular-nums font-medium ${total !== 100 ? "text-destructive" : "text-green-600"}`}>
                {total}%
              </span>
            </div>
          )}
        />
      </div>
    </div>
  )
}

interface CreateBatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (batch: EnrollmentBatch) => void
  defaultYear?: number
}

export function CreateBatchDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultYear,
}: CreateBatchDialogProps) {
  const config: FormConfig<CreateBatchBody> = {
    fields: [
      {
        name: "year",
        kind: "number",
        label: "Year",
        placeholder: "2026",
        required: true,
      },
      {
        name: "student_allocation",
        kind: "slider",
        label: "Total Seats",
        inputProps: { min: 10, max: 1000, step: 10 },
      },
    ],
    layout: [
      { columns: [{ fields: ["year"] }, { fields: ["student_allocation"] }] },
    ],
    renderBelowFields: () => (
      <>
        <ScoreDistributionSection />
        <ReligionDistributionSection />
      </>
    ),
  }

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Batch"
      description="Set up a new G1 admission batch with allocation and scoring weights."
      config={config}
      defaultValues={{
        year: defaultYear ?? new Date().getFullYear(),
        enrollment_type: "G1",
        student_allocation: 200,
        proximity_percentage: 50,
        staff_percentage: 25,
        sibling_percentage: 14,
        alumni_percentage: 6,
        govt_percentage: 4,
        special_percentage: 1,
        buddhism_percentage: 74,
        catholicism_percentage: 12,
        islam_percentage: 14,
        hinduism_percentage: 0,
      }}
      valibotSchema={vCreateBatchBody}
      size="xl"
      onSubmit={async (values) => {
        const total = (values.proximity_percentage ?? 0) + (values.staff_percentage ?? 0) +
          (values.sibling_percentage ?? 0) + (values.alumni_percentage ?? 0) +
          (values.govt_percentage ?? 0) + (values.special_percentage ?? 0)
        if (total !== 100) {
          toast.error(`Score percentages must add up to 100% (currently ${total}%)`)
          throw new Error(`Score percentages must add up to 100% (currently ${total}%)`)
        }
        const religionTotal = (values.buddhism_percentage ?? 0) + (values.catholicism_percentage ?? 0) +
          (values.islam_percentage ?? 0) + (values.hinduism_percentage ?? 0)
        if (religionTotal !== 100) {
          toast.error(`Religion percentages must add up to 100% (currently ${religionTotal}%)`)
          throw new Error(`Religion percentages must add up to 100% (currently ${religionTotal}%)`)
        }
        const { data } = await createBatch({
          body: values,
          client: apiClient,
        })
        toast.success("Batch created")
        onOpenChange(false)
        if (data) onSuccess(data)
      }}
      actionLabel="Create"
    />
  )
}
