"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import {
  getApplicationOptions,
  listApplicationsQueryKey,
  calculateMarksMutation,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  IconArrowLeft,
  IconLoader2,
  IconCheck,
  IconTrophy,
} from "@tabler/icons-react"

const CATEGORIES = [
  {
    code: "PROX",
    label: "Proximity (Residential Address)",
    weight: 50,
    color: "bg-blue-500",
    desc: "Distance from residence to school",
  },
  {
    code: "STAFF",
    label: "School Staff Child",
    weight: 25,
    color: "bg-emerald-500",
    desc: "Parent employed as staff at this school",
  },
  {
    code: "SIBLING",
    label: "Sibling in School",
    weight: 14,
    color: "bg-violet-500",
    desc: "Sibling currently enrolled at this school",
  },
  {
    code: "ALUMNI",
    label: "Past Pupil Child",
    weight: 6,
    color: "bg-amber-500",
    desc: "Parent is a past pupil of this school",
  },
  {
    code: "GOVT",
    label: "Government Employee",
    weight: 4,
    color: "bg-rose-500",
    desc: "Parent is a government employee",
  },
  {
    code: "SPECIAL",
    label: "Special Circumstances",
    weight: 1,
    color: "bg-cyan-500",
    desc: "Disability, low income, or special needs",
  },
]

const DISTANCE_BANDS = [
  { max: 0.5, label: "< 0.5 km", raw: 100 },
  { max: 1.0, label: "0.5 - 1 km", raw: 80 },
  { max: 2.0, label: "1 - 2 km", raw: 60 },
  { max: 3.0, label: "2 - 3 km", raw: 40 },
  { max: 5.0, label: "3 - 5 km", raw: 20 },
  { max: Infinity, label: "> 5 km", raw: 10 },
]

interface Props {
  enrollmentId: string
}

export function ScoringDashboard({ enrollmentId }: Props) {
  const navigate = useNavigate()

  const { data: application, isLoading } = useQuery(
    getApplicationOptions({ path: { id: enrollmentId }, client: apiClient })
  )

  const calcMarks = useMutation(calculateMarksMutation({ client: apiClient }))

  const handleCalculate = async () => {
    try {
      await calcMarks.mutateAsync({ path: { id: enrollmentId } })
      queryClient.invalidateQueries({
        queryKey: listApplicationsQueryKey({ client: apiClient }),
      })
      toast.success("Marks calculated successfully")
    } catch {
      toast.error("Failed to calculate marks")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-semibold text-muted-foreground">
          Application not found
        </p>
      </div>
    )
  }

  const totalMarks = application.total_marks
    ? parseFloat(application.total_marks)
    : 0
  const hasMarks = totalMarks > 0

  const rankedCategories = [...CATEGORIES]
    .map((c) => {
      const weightedMax = c.weight
      return {
        ...c,
        weightedScore: hasMarks ? weightedMax * (totalMarks / 100) : 0,
      }
    })
    .sort((a, b) => b.weightedScore - a.weightedScore)

  const bestCategory = hasMarks ? rankedCategories[0] : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate({ to: "/student-management/enrollment/g1" })
            }
          >
            <IconArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">Scoring & Marks</h2>
            <p className="text-sm text-muted-foreground">
              {application.full_name} &middot; {application.reference_no}
            </p>
          </div>
        </div>
        <Button onClick={handleCalculate} disabled={calcMarks.isPending}>
          {calcMarks.isPending ? (
            <IconLoader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <IconCheck className="mr-2 size-4" />
          )}
          Calculate Marks
        </Button>
      </div>

      {hasMarks && bestCategory && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <IconTrophy className="size-7" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Best Performing Category
                </p>
                <p className="text-lg font-bold">{bestCategory.label}</p>
                <p className="text-sm text-muted-foreground">
                  Weight: {bestCategory.weight}% &middot; Estimated
                  contribution: {bestCategory.weightedScore.toFixed(2)} pts
                </p>
              </div>
              <div className="ms-auto text-right">
                <p className="text-3xl font-bold tabular-nums">
                  {totalMarks.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Total Marks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const raw = 0
          const weighted = 0
          const hasValue = raw > 0

          return (
            <Card
              key={cat.code}
              className={hasValue ? "ring-1 ring-primary/20" : "opacity-60"}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`size-3 rounded-full ${cat.color}`} />
                    <CardTitle className="text-sm">{cat.label}</CardTitle>
                  </div>
                  <Badge
                    variant={hasValue ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {cat.weight}%
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-2 pt-4">
                {!hasValue && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No data provided for this category
                  </p>
                )}
                {hasValue && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Raw Score</span>
                      <span className="font-mono font-medium tabular-nums">
                        {raw.toFixed(2)} / 100
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Weighted Score
                      </span>
                      <span className="font-mono font-bold tabular-nums">
                        {weighted.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${cat.color} rounded-full transition-all`}
                        style={{ width: `${raw}%` }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-3 font-semibold">
          Distance Bands (Proximity Scoring)
        </h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {DISTANCE_BANDS.map((band) => (
            <div
              key={band.label}
              className="rounded-lg border bg-muted/30 p-3 text-center"
            >
              <p className="text-xs text-muted-foreground">{band.label}</p>
              <p className="text-lg font-bold tabular-nums">{band.raw}</p>
              <p className="text-[10px] text-muted-foreground">raw marks</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
