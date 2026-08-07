"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { ChildFormData } from "../wizard/wizard-step-child"
import type { G1Application } from "@/lib/api-client/types.gen"
import type { InterviewMarks } from "./interview-shell"
import { getInitials } from "@/lib/utils"
import {
  IconCheck,
  IconClipboardCheck,
  IconCalendar,
  IconAward,
  IconAlertTriangle,
} from "@tabler/icons-react"

const CATEGORY_LABELS: Record<string, string> = {
  CloseResident: "Close Resident (50%)",
  PastPupilChild: "Past Pupil / Alumni (25%)",
  Sibling: "Sibling (14%)",
  MOEOrUGCStaffChild: "MOE / UGC Staff (6%)",
  GovernmentTransferOfficerChild: "Govt Transfer (4%)",
  OverseasArrival: "Overseas Arrival (1%)",
  ArmedForcesReserved: "Armed Forces (Special)",
  SpecialNeeds: "Special Needs",
  LowIncome: "Low Income",
}

const CRITERIA_LABELS: Record<string, Record<string, string>> = {
  CloseResident: {
    residence_duration: "Residence Duration",
    supporting_documents: "Supporting Documents",
    electoral_registration: "Electoral Registration",
    proximity_to_school: "Proximity to School",
  },
  PastPupilChild: {
    years_studied: "Years Studied",
    academic_achievements: "Academic Achievements",
    extra_curricular: "Extra-curricular",
    alumni_membership: "Alumni Membership",
  },
  Sibling: {
    residence_duration: "Residence Duration",
    electoral_registration: "Electoral Registration",
    sibling_grades: "Sibling's Grades",
    sibling_entry_grade: "Entry Grade Bonus",
    multiple_siblings: "Multiple Siblings",
    school_contributions: "Contributions",
  },
  MOEOrUGCStaffChild: {
    service_duration: "Service Duration",
    national_contributions: "National Contributions",
    difficult_area_service: "Difficult Area Service",
    posting_distance: "Posting Distance",
    residence_distance: "Residence Distance",
    unused_leave: "Unused Leave",
    permanent_employment: "Permanent Employment",
  },
  GovernmentTransferOfficerChild: {
    posting_distance: "Posting Distance",
    residence_distance: "Residence Distance",
    service_years: "Service Years",
    previous_posting: "Previous Posting",
    time_since_transfer: "Time Since Transfer",
    unused_leave: "Unused Leave",
  },
  OverseasArrival: {
    duration_abroad: "Duration Abroad",
    nature_of_stay: "Nature of Stay",
    proximity_to_school: "Proximity to School",
  },
}

const MAX_POSSIBLE: Record<string, number> = {
  CloseResident: 100,
  PastPupilChild: 100,
  Sibling: 100,
  MOEOrUGCStaffChild: 105,
  GovernmentTransferOfficerChild: 100,
  OverseasArrival: 100,
}

interface Props {
  child: ChildFormData
  application: G1Application
  marks: Record<string, InterviewMarks>
  interviewDate: string
  onInterviewDateChange: (date: string) => void
  onBack: () => void
  onComplete: () => void
}

export function InterviewStepSummary({
  child,
  application,
  marks,
  interviewDate,
  onInterviewDateChange,
  onBack,
  onComplete,
}: Props) {
  const category = application.category ?? ""
  const categoryMarks = marks[category]
  const totalMarks = categoryMarks?.totalMarks ?? 0
  const maxPossible = MAX_POSSIBLE[category] ?? 100
  const percentage = maxPossible > 0 ? Math.round((totalMarks / maxPossible) * 100) : 0
  const criteriaLabels = CRITERIA_LABELS[category] ?? {}

  const scoreRating = useMemo(() => {
    if (percentage >= 80) return { label: "Excellent", color: "text-green-600" }
    if (percentage >= 60) return { label: "Good", color: "text-blue-600" }
    if (percentage >= 40) return { label: "Average", color: "text-amber-600" }
    return { label: "Below Average", color: "text-red-600" }
  }, [percentage])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Interview Summary & Completion</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the scoring summary before finalizing the interview. Per circular 8.0,
          the panel chairperson must log all decisions in the record book.
        </p>
      </div>

      {/* Completion Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/20">
        <IconClipboardCheck className="size-5 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Interview Completion
          </p>
          <p className="mt-0.5 text-xs text-green-700 dark:text-green-300">
            Per circular 8.0, after scoring, a summary receipt must be given to the applicant
            for each category scored. The applicant must sign acknowledging the scores.
            Any discrepancy must be explained.
          </p>
        </div>
      </div>

      {/* Child Info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-12">
              <AvatarFallback className="text-sm font-semibold">
                {child.full_name ? getInitials(child.full_name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{child.full_name}</h3>
              <p className="text-sm text-muted-foreground">{child.name_with_initials}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline">
                {CATEGORY_LABELS[category] ?? category}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <IconCalendar className="size-4" />
            Interview Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="date"
            value={interviewDate}
            onChange={(e) => onInterviewDateChange(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </CardContent>
      </Card>

      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAward className="size-4" />
            Score Summary
          </CardTitle>
          <CardDescription>
            Final scoring breakdown for the {CATEGORY_LABELS[category] ?? category} category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Total Score Display */}
          <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div>
              <p className="text-sm font-medium">Total Score</p>
              <p className={`text-lg font-bold ${scoreRating.color}`}>
                {scoreRating.label}
              </p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold tabular-nums">{totalMarks}</span>
              <span className="text-sm text-muted-foreground"> / {maxPossible}</span>
              <p className="text-xs text-muted-foreground">{percentage}%</p>
            </div>
          </div>

          {/* Criteria Breakdown */}
          <div className="space-y-2">
            {categoryMarks &&
              Object.entries(categoryMarks.subCriteria).map(([key, score]) => {
                const maxForCriterion = key === "residence_duration" && category === "Sibling" ? 40
                  : key === "electoral_registration" && category === "Sibling" ? 20
                  : key === "residence_duration" ? 20
                  : key === "supporting_documents" ? 5
                  : key === "electoral_registration" ? 25
                  : key === "proximity_to_school" && category === "CloseResident" ? 50
                  : key === "proximity_to_school" && category === "OverseasArrival" ? 35
                  : 25

                const pct = maxForCriterion > 0 ? (score / maxForCriterion) * 100 : 0

                return (
                  <div key={key} className="flex items-center gap-3 rounded bg-muted/30 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">
                        {criteriaLabels[key] ?? key}
                      </p>
                    </div>
                    <div className="w-32">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-16 text-right text-xs font-medium tabular-nums">
                      {score} / {maxForCriterion}
                    </span>
                  </div>
                )
              })}
          </div>

          {/* Notes */}
          {categoryMarks?.notes && (
            <div className="mt-4 rounded-md bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">Interview Notes</p>
              <p className="mt-1 text-sm">{categoryMarks.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provisional List Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Provisional List & Appeal Process</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Per circular 9.0, the panel prepares a <strong>provisional selection list</strong> and
            a <strong>waitlist</strong> (50% of vacancies per category). Both are displayed for a
            minimum of 2 days.
          </p>
          <p className="text-xs text-muted-foreground">
            Per circular 10.0, only applicants who appeared for the interview can file
            appeals/protests within 2 weeks of the provisional list being displayed.
          </p>
        </CardContent>
      </Card>

      {/* Forgery Warning */}
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/20">
        <IconAlertTriangle className="size-5 shrink-0 text-red-600 dark:text-red-400" />
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Important Notice
          </p>
          <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
            Per circular 7.1.3, if any document is found to be forged, the applicant is
            disqualified from ALL categories. Per circular 13.0, accepting or giving money/gifts
            for admission is completely prohibited and illegal.
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button size="lg">
                <IconCheck className="size-4" />
                Complete Interview Procedure
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete Interview Procedure</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the interview as completed and save the total score of{' '}
                <strong>{totalMarks}</strong> points. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onComplete}>Complete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
