"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useParams, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import {
  getApplicationOptions,
  getApplicationGuardiansOptions,
  getApplicationAddressesOptions,
  getApplicationSiblingsOptions,
  getApplicationDocumentsOptions,
  getChildOptions,
  listAddressesOptions,
  listGuardiansOptions,
  listStudentsOptions,
  listSchoolsOptions,
  updateApplicationMutation,
  listApplicationsQueryKey,
  meOptions,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import type { Student } from "@/lib/api-client/types.gen"
import type { ChildFormData } from "../wizard/wizard-step-child"
import type { DocumentFormData } from "../wizard/wizard-step-documents"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { InterviewStepOverview } from "./interview-step-overview"
import { InterviewStepDocuments } from "./interview-step-documents"
import { InterviewStepCategoryScoring } from "./interview-step-category-scoring"
import { InterviewStepSummary } from "./interview-step-summary"

export type InterviewMarks = {
  category: string
  subCriteria: Record<string, number>
  totalMarks: number
  notes: string
}

const STEPS = ["Overview", "Document Verification", "Category Scoring", "Summary & Completion"]

export function InterviewShell() {
  const params = useParams({
    from: "/_authenticated/student-management/enrollment/g1/$enrollment_id/interview",
  })
  const navigate = useNavigate()
  const enrollmentId = params.enrollment_id

  const { data: application } = useQuery(
    getApplicationOptions({ path: { id: enrollmentId }, client: apiClient })
  )

  const { data: guardians = [] } = useQuery(
    listGuardiansOptions({ client: apiClient })
  )

  const { data: applicationGuardianIds } = useQuery(
    getApplicationGuardiansOptions({
      path: { id: enrollmentId },
      client: apiClient,
    })
  )

  const { data: applicationAddressEntries } = useQuery(
    getApplicationAddressesOptions({
      path: { id: enrollmentId },
      client: apiClient,
    })
  )

  const { data: applicationSiblingIds } = useQuery(
    getApplicationSiblingsOptions({
      path: { id: enrollmentId },
      client: apiClient,
    })
  )

  const { data: serverDocuments } = useQuery(
    getApplicationDocumentsOptions({
      path: { id: enrollmentId },
      client: apiClient,
    })
  )

  const { data: allAddresses = [] } = useQuery(
    listAddressesOptions({ client: apiClient })
  )

  const { data: students = [] } = useQuery(
    listStudentsOptions({ client: apiClient })
  )

  const { data: schools = [] } = useQuery(
    listSchoolsOptions({ client: apiClient })
  )

  const { data: currentUser } = useQuery(meOptions({ client: apiClient }))
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin"

  const { data: childRecord } = useQuery({
    ...getChildOptions({ path: { id: application?.child_id ?? "" }, client: apiClient }),
    enabled: !!application?.child_id,
  })

  const updateApplication = useMutation(
    updateApplicationMutation({ client: apiClient })
  )

  const [step, setStep] = useState(() => {
    const saved = application?.wizard_step ?? 1
    return saved > STEPS.length ? 1 : saved
  })
  const [interviewDate, setInterviewDate] = useState<string>(
    application?.interview_date ?? new Date().toISOString().split("T")[0]
  )

  useEffect(() => {
    if (application?.wizard_step) {
      const s = application.wizard_step
      setStep(s > STEPS.length ? 1 : s)
    }
    if (application?.interview_date) setInterviewDate(application.interview_date)
  }, [application?.wizard_step, application?.interview_date])

  const saveStep = useCallback(
    async (newStep: number) => {
      setStep(newStep)
      try {
        await updateApplication.mutateAsync({
          path: { id: enrollmentId },
          body: { wizard_step: newStep },
        })
      } catch {
        // silent — step will be lost on refresh but data is intact
      }
    },
    [enrollmentId, updateApplication]
  )

  const selectedGuardians = useMemo(() => {
    const ids = applicationGuardianIds?.guardian_ids ?? []
    return guardians.filter((g) => ids.includes(g.id))
  }, [guardians, applicationGuardianIds])

  const selectedAddresses = useMemo(() => {
    return (applicationAddressEntries?.addresses ?? []).map((a) => ({
      address_id: a.address_id,
      address_type: a.address_type,
      residence_type: a.residence_type,
      is_primary: a.is_primary,
    }))
  }, [applicationAddressEntries])

  const selectedSiblings = useMemo(() => {
    const ids = applicationSiblingIds?.sibling_ids ?? []
    const studentMap = new Map(students.map((s) => [s.id, s]))
    return ids.map((id) => studentMap.get(id)).filter(Boolean) as Student[]
  }, [students, applicationSiblingIds])

  const serverDocs: DocumentFormData[] = useMemo(() => {
    return (serverDocuments?.documents ?? []).map((d) => ({
      tempId: crypto.randomUUID(),
      doc_type: d.doc_type,
      file: null,
      file_url: d.file_url,
      file_key: d.file_key,
      content_type: d.content_type ?? undefined,
      file_size: d.file_size != null ? Number(d.file_size) : undefined,
      file_name: d.file_name ?? undefined,
      file_type: d.content_type ?? undefined,
      status: "uploaded" as const,
    }))
  }, [serverDocuments])

  const [documents, setDocuments] = useState<DocumentFormData[]>(serverDocs)

  useEffect(() => {
    setDocuments(serverDocs)
  }, [serverDocs])

  const childData: ChildFormData | null = useMemo(() => {
    if (!childRecord) return null
    return {
      full_name: childRecord.full_name,
      name_with_initials: childRecord.name_with_initials,
      name_with_initials_en: childRecord.name_with_initials_en ?? "",
      date_of_birth: childRecord.date_of_birth,
      gender: childRecord.gender,
      nationality: childRecord.nationality,
      religion: (childRecord.religion ?? undefined) as any,
      birth_certificate_number: childRecord.birth_certificate_number ?? "",
      medium_of_instruction: childRecord.medium_of_instruction,
    }
  }, [childRecord])

  const [interviewMarks, setInterviewMarks] = useState<Record<string, InterviewMarks>>({})

  const handleMarkChange = useCallback((category: string, subCriterion: string, marks: number) => {
    setInterviewMarks((prev) => {
      const existing = prev[category] || { category, subCriteria: {}, totalMarks: 0, notes: "" }
      const newSubCriteria = { ...existing.subCriteria, [subCriterion]: marks }
      const totalMarks = Object.values(newSubCriteria).reduce((sum, m) => sum + m, 0)
      return {
        ...prev,
        [category]: { ...existing, subCriteria: newSubCriteria, totalMarks },
      }
    })
  }, [])

  const handleNotesChange = useCallback((category: string, notes: string) => {
    setInterviewMarks((prev) => {
      const existing = prev[category] || { category, subCriteria: {}, totalMarks: 0, notes: "" }
      return { ...prev, [category]: { ...existing, notes } }
    })
  }, [])

  const handleComplete = useCallback(async () => {
    try {
      await updateApplication.mutateAsync({
        path: { id: enrollmentId },
        body: {
          interview_completed: true,
          interview_date: interviewDate,
        },
      })
      queryClient.invalidateQueries({
        queryKey: listApplicationsQueryKey({ client: apiClient }),
      })
      toast.success("Interview procedure completed successfully")
      navigate({ to: "/student-management/enrollment/g1" })
    } catch (err) {
      toastApiError(err, "Failed to save interview results")
    }
  }, [interviewDate, enrollmentId, updateApplication, navigate])

  if (!application || !childData) {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="text-muted-foreground">Loading application data...</p>
      </div>
    )
  }

  return (
    <div className="flex size-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/student-management/enrollment/g1" })}
        >
          <IconArrowLeft className="mr-2 size-4" /> Back to Pipeline
        </Button>
        <h1 className="text-xl font-bold">Interview Procedure</h1>
      </div>

      <div className="flex items-center justify-center gap-2 pb-2">
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const isActive = step === stepNum
          const isCompleted = stepNum < step
          return (
            <div key={label} className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={stepNum > step}
                onClick={() => stepNum <= step && saveStep(stepNum)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "border-primary font-medium text-primary"
                    : isCompleted
                      ? "cursor-pointer border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                      : "border-muted-foreground/20 text-muted-foreground/40"
                }`}
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted/50 text-muted-foreground/40"
                  }`}
                >
                  {isCompleted ? "\u2713" : stepNum}
                </span>
                {label}
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-6 shrink-0 ${
                    isCompleted ? "bg-green-500" : "bg-muted-foreground/30"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          {step === 1 && (
            <InterviewStepOverview
              child={childData}
              application={application}
              guardians={selectedGuardians}
              addresses={selectedAddresses}
              allAddresses={allAddresses}
              siblings={selectedSiblings}
              schools={schools}
              documents={documents}
              onNext={() => saveStep(2)}
            />
          )}
          {step === 2 && (
            <InterviewStepDocuments
              documents={documents}
              onDocumentsChange={(docs) => setDocuments(docs)}
              onBack={() => saveStep(1)}
              onNext={() => saveStep(3)}
              enrollmentId={enrollmentId}
              isAdmin={isAdmin}
            />
          )}
          {step === 3 && (
            <InterviewStepCategoryScoring
              category={application.category ?? ""}
              marks={interviewMarks}
              guardians={selectedGuardians}
              addresses={selectedAddresses}
              allAddresses={allAddresses}
              siblings={selectedSiblings}
              schools={schools}
              documents={documents}
              onMarkChange={handleMarkChange}
              onNotesChange={handleNotesChange}
              onBack={() => saveStep(2)}
              onNext={() => saveStep(4)}
            />
          )}
          {step === 4 && (
            <InterviewStepSummary
              child={childData}
              application={application}
              marks={interviewMarks}
              interviewDate={interviewDate}
              onInterviewDateChange={setInterviewDate}
              onBack={() => saveStep(3)}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  )
}
