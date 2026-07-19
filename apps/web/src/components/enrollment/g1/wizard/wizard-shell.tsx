"use client"

import { useState, useCallback } from "react"
import { useParams, useNavigate } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { updateApplicationMutation } from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import { Button } from "@/components/ui/button"
import { WizardStepChild } from "./wizard-step-child"
import { WizardStepGuardian } from "./wizard-step-guardian"
import { WizardStepSchool } from "./wizard-step-school"
import { WizardStepAddress } from "./wizard-step-address"
import { WizardStepSiblings } from "./wizard-step-siblings"
import { WizardStepDocuments } from "./wizard-step-documents"
import { WizardStepReview } from "./wizard-step-review"

export interface GuardianData {
  tempId: string
  relationship: string
  full_name: string
  nic: string
  phone: string
  email: string
  occupation: string
  workplace: string
  workplace_address: string
  income: string
  is_staff: boolean
  staff_designation: string
  staff_employment_type: string
  staff_service_start: string
  is_alumni: boolean
  alumni_highest_grade: string
  alumni_year_left: string
  alumni_left_reason: string
  is_govt_employee: boolean
  govt_service_years: number
  is_special: boolean
  disability: boolean
  conflict_area: boolean
  single_parent: boolean
}

export interface SiblingData {
  tempId: string
  sibling_name: string
  current_grade: number
  admission_year: string
}

export interface DocumentData {
  tempId: string
  doc_type: string
  file: File | null
  file_url: string
  status: "pending" | "uploaded"
}

export interface WizardState {
  step: number
  child: {
    full_name: string
    name_with_initials: string
    date_of_birth: string
    gender: string
    religion: string
    nationality: string
    birth_certificate_number: string
  }
  guardians: GuardianData[]
  school: {
    school_id: string
    school_name_si: string
    school_type: string
    category: string
    quota: number
  }
  address: {
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
  siblings: SiblingData[]
  documents: DocumentData[]
}

const STEPS = [
  "Child",
  "Guardian",
  "School",
  "Address",
  "Siblings",
  "Documents",
  "Review & Lock",
]

export function WizardShell() {
  const params = useParams({ from: "/_authenticated/student-management/enrollment/g1/$enrollment-id" })
  const navigate = useNavigate()
  const enrollmentId = params["enrollment-id"]

  const [state, setState] = useState<WizardState>({
    step: 1,
    child: {
      full_name: "",
      name_with_initials: "",
      date_of_birth: "",
      gender: "Male",
      religion: "",
      nationality: "SriLankan",
      birth_certificate_number: "",
    },
    guardians: [
      {
        tempId: crypto.randomUUID(),
        relationship: "Father",
        full_name: "",
        nic: "",
        phone: "",
        email: "",
        occupation: "",
        workplace: "",
        workplace_address: "",
        income: "",
        is_staff: false,
        staff_designation: "",
        staff_employment_type: "Permanent",
        staff_service_start: "",
        is_alumni: false,
        alumni_highest_grade: "",
        alumni_year_left: "",
        alumni_left_reason: "",
        is_govt_employee: false,
        govt_service_years: 0,
        is_special: false,
        disability: false,
        conflict_area: false,
        single_parent: false,
      },
    ],
    school: {
      school_id: "",
      school_name_si: "",
      school_type: "",
      category: "",
      quota: 0,
    },
    address: {
      line1: "",
      line2: "",
      city: "",
      district: "",
      province: "",
      gs_division: "",
      postal_code: "",
      residence_type: "Owned",
      ownership_proof: "",
      lat: 0,
      lon: 0,
      distance_km: 0,
      distance_band: "",
    },
    siblings: [],
    documents: [],
  })

  const updateApplication = useMutation(
    updateApplicationMutation({ client: apiClient }),
  )

  const uid = () => crypto.randomUUID()

  const handleSaveDraft = useCallback(async () => {
    try {
      await updateApplication.mutateAsync({
        path: { id: enrollmentId },
        body: {
          full_name: state.child.full_name,
          name_with_initials: state.child.name_with_initials,
          date_of_birth: state.child.date_of_birth || "2000-01-01",
          gender: state.child.gender as any,
          nationality: state.child.nationality as any,
          category: "CloseResident",
          medium_of_instruction: "Sinhala",
          batch_id: "00000000-0000-0000-0000-000000000000",
          applied_year: new Date().getFullYear(),
          child_id: uid(),
          guardian_id: uid(),
          reference_no: `REF-${Date.now()}`,
          school_id: "00000000-0000-0000-0000-000000000000",
        },
      })
      toast.success("Progress saved")
    } catch {
      toast.error("Failed to save progress")
    }
  }, [enrollmentId, state.child, updateApplication])

  const handleComplete = useCallback(async () => {
    try {
      await updateApplication.mutateAsync({
        path: { id: enrollmentId },
        body: {
          full_name: state.child.full_name,
          name_with_initials: state.child.name_with_initials,
          date_of_birth: state.child.date_of_birth || "2000-01-01",
          gender: state.child.gender as any,
          nationality: state.child.nationality as any,
          category: "CloseResident",
          medium_of_instruction: "Sinhala",
          batch_id: "00000000-0000-0000-0000-000000000000",
          applied_year: new Date().getFullYear(),
          child_id: uid(),
          guardian_id: uid(),
          reference_no: `REF-${Date.now()}`,
          school_id: "00000000-0000-0000-0000-000000000000",
          enrollment_status: "ProvisionallyApproved",
        },
      })
      queryClient.invalidateQueries({ queryKey: ["applications"] })
      toast.success("Enrollment completed. Awaiting processing.")
      navigate({ to: "/student-management/enrollment/g1" } as any)
    } catch {
      toast.error("Failed to complete enrollment")
    }
  }, [enrollmentId, state.child, updateApplication, navigate])

  const goToStep = (step: number) => {
    if (step <= state.step + 1) {
      setState((prev) => ({ ...prev, step }))
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => window.history.back()}>
          &larr; Back
        </Button>
        <h1 className="text-xl font-bold">Enrollment Wizard</h1>
        <Button variant="outline" onClick={handleSaveDraft}>Save Progress</Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const isActive = state.step === stepNum
          const isCompleted = state.step > stepNum
          return (
            <div key={label} className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => goToStep(stepNum)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  isActive
                    ? "border-primary text-primary font-medium"
                    : isCompleted
                      ? "border-green-500 text-green-600"
                      : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                <span
                  className={`size-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? "\u2713" : stepNum}
                </span>
                {label}
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-6 ${
                    isCompleted ? "bg-green-500" : "bg-muted-foreground/30"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      <div>
        {state.step === 1 && (
          <WizardStepChild
            data={state.child}
            onChange={(child) => setState((prev) => ({ ...prev, child }))}
            onNext={() => setState((prev) => ({ ...prev, step: 2 }))}
          />
        )}
        {state.step === 2 && (
          <WizardStepGuardian
            guardians={state.guardians}
            onChange={(guardians) => setState((prev) => ({ ...prev, guardians }))}
            onBack={() => setState((prev) => ({ ...prev, step: 1 }))}
            onNext={() => setState((prev) => ({ ...prev, step: 3 }))}
          />
        )}
        {state.step === 3 && (
          <WizardStepSchool
            data={state.school}
            onChange={(school) => setState((prev) => ({ ...prev, school }))}
            onBack={() => setState((prev) => ({ ...prev, step: 2 }))}
            onNext={() => setState((prev) => ({ ...prev, step: 4 }))}
          />
        )}
        {state.step === 4 && (
          <WizardStepAddress
            data={state.address}
            onChange={(address) => setState((prev) => ({ ...prev, address }))}
            onBack={() => setState((prev) => ({ ...prev, step: 3 }))}
            onNext={() => setState((prev) => ({ ...prev, step: 5 }))}
          />
        )}
        {state.step === 5 && (
          <WizardStepSiblings
            siblings={state.siblings}
            onChange={(siblings) => setState((prev) => ({ ...prev, siblings }))}
            onBack={() => setState((prev) => ({ ...prev, step: 4 }))}
            onNext={() => setState((prev) => ({ ...prev, step: 6 }))}
          />
        )}
        {state.step === 6 && (
          <WizardStepDocuments
            documents={state.documents}
            guardians={state.guardians}
            onChange={(documents) => setState((prev) => ({ ...prev, documents }))}
            onBack={() => setState((prev) => ({ ...prev, step: 5 }))}
            onNext={() => setState((prev) => ({ ...prev, step: 7 }))}
          />
        )}
        {state.step === 7 && (
          <WizardStepReview
            state={state}
            onBack={() => setState((prev) => ({ ...prev, step: 6 }))}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  )
}
