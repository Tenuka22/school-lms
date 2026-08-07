"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { EnrollmentBatch } from "@/lib/api-client/types.gen"

const religionConfig = {
  Buddhism: { label: "Buddhism", color: "var(--chart-1)" },
  Catholicism: { label: "Catholicism", color: "var(--chart-2)" },
  Islam: { label: "Islam", color: "var(--chart-3)" },
  Hinduism: { label: "Hinduism", color: "var(--chart-4)" },
} satisfies ChartConfig

const categoryConfig = {
  Proximity: { label: "Proximity", color: "var(--chart-1)" },
  Staff: { label: "Staff", color: "var(--chart-2)" },
  Sibling: { label: "Sibling", color: "var(--chart-3)" },
  Alumni: { label: "Alumni", color: "var(--chart-4)" },
  Govt: { label: "Govt", color: "var(--chart-5)" },
  Special: { label: "Special", color: "var(--chart-6)" },
} satisfies ChartConfig

interface BatchOverviewChartProps {
  batch: EnrollmentBatch | null | undefined
}

export function BatchOverviewChart({ batch }: BatchOverviewChartProps) {
  const religionData = [
    { name: "Buddhism", value: batch?.buddhism_percentage ?? 74, fill: "var(--color-Buddhism)" },
    { name: "Catholicism", value: batch?.catholicism_percentage ?? 12, fill: "var(--color-Catholicism)" },
    { name: "Islam", value: batch?.islam_percentage ?? 14, fill: "var(--color-Islam)" },
    { name: "Hinduism", value: batch?.hinduism_percentage ?? 0, fill: "var(--color-Hinduism)" },
  ].filter((d) => d.value > 0)

  const categoryData = [
    { name: "Proximity", value: batch?.proximity_percentage ?? 50, fill: "var(--color-Proximity)" },
    { name: "Staff", value: batch?.staff_percentage ?? 25, fill: "var(--color-Staff)" },
    { name: "Sibling", value: batch?.sibling_percentage ?? 14, fill: "var(--color-Sibling)" },
    { name: "Alumni", value: batch?.alumni_percentage ?? 6, fill: "var(--color-Alumni)" },
    { name: "Govt", value: batch?.govt_percentage ?? 4, fill: "var(--color-Govt)" },
    { name: "Special", value: batch?.special_percentage ?? 1, fill: "var(--color-Special)" },
  ].filter((d) => d.value > 0)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Religion Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2 sm:p-6 sm:pt-0">
          <ChartContainer config={religionConfig} className="h-[200px] w-full">
            <BarChart
              data={religionData}
              layout="vertical"
              margin={{ left: 0, right: 16 }}
            >
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={90}
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${value}%`, "Allocation"]}
                  />
                }
              />
              <Bar dataKey="value" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Category Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-2 sm:p-6 sm:pt-0">
          <ChartContainer config={categoryConfig} className="h-[200px] w-full">
            <BarChart
              data={categoryData}
              layout="vertical"
              margin={{ left: 0, right: 16 }}
            >
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={90}
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}%`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${value}%`, "Allocation"]}
                  />
                }
              />
              <Bar dataKey="value" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
