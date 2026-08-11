"use client"

import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { createBatch } from "@/lib/api-client/sdk.gen"
import { vCreateBatchBody } from "@/lib/api-client/valibot.gen"
import type { EnrollmentBatch } from "@/lib/api-client/types.gen"
import { EntityDialog, useBuildForm } from "@/lib/form-builder"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { FieldLabel } from "@/components/ui/field"
import {
  batchFormConfig,
  batchFormDefaults,
} from "@/components/forms/batch-form"

function ReligionDistributionSection() {
  const form = useBuildForm()

  const religionFields = [
    { name: "buddhism_percentage", label: "Buddhist", color: "bg-amber-600" },
    {
      name: "catholicism_percentage",
      label: "Catholic",
      color: "bg-purple-600",
    },
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
                  <FieldLabel htmlFor={field.name}>{p.label}</FieldLabel>
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
                          Math.min(
                            100,
                            Math.max(0, Number(e.target.value) || 0)
                          )
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
            return (
              (v.buddhism_percentage ?? 0) +
              (v.catholicism_percentage ?? 0) +
              (v.islam_percentage ?? 0) +
              (v.hinduism_percentage ?? 0)
            )
          }}
          children={(total: number) => (
            <div className="flex items-center justify-between border-t pt-2 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span
                className={`font-medium tabular-nums ${total !== 100 ? "text-destructive" : "text-green-600"}`}
              >
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
  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Batch"
      description="Set up a new G1 admission batch."
      config={{
        ...batchFormConfig,
        renderBelowFields: () => <ReligionDistributionSection />,
      }}
      defaultValues={{
        ...batchFormDefaults,
        year: defaultYear ?? new Date().getFullYear(),
      }}
      valibotSchema={vCreateBatchBody}
      size="xl"
      onSubmit={async (values) => {
        const religionTotal =
          (values.buddhism_percentage ?? 0) +
          (values.catholicism_percentage ?? 0) +
          (values.islam_percentage ?? 0) +
          (values.hinduism_percentage ?? 0)
        if (religionTotal !== 100) {
          toast.error(
            `Religion percentages must add up to 100% (currently ${religionTotal}%)`
          )
          throw new Error(
            `Religion percentages must add up to 100% (currently ${religionTotal}%)`
          )
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
