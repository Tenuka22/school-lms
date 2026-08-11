"use client"

import { useMemo } from "react"
import { barX, colorLegend, defineChart, stack } from "@tanstack/charts"
import { scaleBand } from "@tanstack/charts/scales/band"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
import { Chart } from "@tanstack/charts/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { EnrollmentBatch } from "@/lib/api-client/types.gen"

interface BatchOverviewChartProps {
  batch: EnrollmentBatch | null | undefined
}

const SEGMENT_COLORS = {
  Buddhism: "var(--chart-1)",
  Catholicism: "var(--chart-2)",
  Islam: "var(--chart-3)",
  Hinduism: "var(--chart-4)",
  Proximity: "var(--chart-1)",
  Staff: "var(--chart-2)",
  Sibling: "var(--chart-3)",
  Alumni: "var(--chart-4)",
  Govt: "var(--chart-5)",
  Special: "var(--chart-5)",
} as const

type SegmentName = keyof typeof SEGMENT_COLORS

interface SegmentRow {
  group: string
  segment: SegmentName
  value: number
}

export function BatchOverviewChart({ batch }: BatchOverviewChartProps) {
  const data = useMemo<SegmentRow[]>(() => {
    const religion: SegmentRow[] = [
      {
        group: "Religion",
        segment: "Buddhism",
        value: batch?.buddhism_percentage ?? 74,
      },
      {
        group: "Religion",
        segment: "Catholicism",
        value: batch?.catholicism_percentage ?? 12,
      },
      {
        group: "Religion",
        segment: "Islam",
        value: batch?.islam_percentage ?? 14,
      },
      {
        group: "Religion",
        segment: "Hinduism",
        value: batch?.hinduism_percentage ?? 0,
      },
    ]

    const category: SegmentRow[] = [
      {
        group: "Category",
        segment: "Proximity",
        value: batch?.proximity_percentage ?? 50,
      },
      {
        group: "Category",
        segment: "Staff",
        value: batch?.staff_percentage ?? 25,
      },
      {
        group: "Category",
        segment: "Sibling",
        value: batch?.sibling_percentage ?? 14,
      },
      {
        group: "Category",
        segment: "Alumni",
        value: batch?.alumni_percentage ?? 6,
      },
      {
        group: "Category",
        segment: "Govt",
        value: batch?.govt_percentage ?? 4,
      },
      {
        group: "Category",
        segment: "Special",
        value: batch?.special_percentage ?? 1,
      },
    ]

    return [...religion, ...category].filter((d) => d.value > 0)
  }, [batch])

  const segmentNames = useMemo(
    () => [...new Set(data.map((d) => d.segment))],
    [data]
  )

  const chart = useMemo(
    () =>
      defineChart({
        marks: [
          barX(data, {
            x: "value",
            y: "group",
            z: "segment",
            color: "segment",
            layout: stack(),
            radius: 3,
          }),
        ],
        x: {
          scale: scaleLinear,
          nice: true,
          axis: {
            ticks: { format: (v: number) => `${v}%` },
          },
        },
        y: {
          scale: () => scaleBand<string>().padding(0.4),
        },
        color: {
          domain: segmentNames,
          range: segmentNames.map((n) => SEGMENT_COLORS[n]),
          legend: colorLegend({ label: "Allocation" }),
        },
        focus: "group-x",
        tooltip: {
          use: tooltip,
          anchor: "group-center",
          sort: "color-domain",
        },
      }),
    [data, segmentNames]
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Batch Allocation Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2 sm:p-6 sm:pt-0">
        <Chart
          definition={chart}
          height={140}
          ariaLabel="Batch allocation overview"
        />
      </CardContent>
    </Card>
  )
}
