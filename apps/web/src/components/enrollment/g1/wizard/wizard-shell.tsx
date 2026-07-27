"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useParams, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { toastApiError } from "@/lib/api-error"
import { apiClient } from "@/lib/api-client"
import {
  getApplicationOptions,
  getApplicationQueryKey,
  getApplicationGuardiansOptions,
  getApplicationGuardiansQueryKey,
  getApplicationAddressesOptions,
  getApplicationAddressesQueryKey,
  getApplicationSiblingsOptions,
  getApplicationSiblingsQueryKey,
  getApplicationDocumentsOptions,
  listApplicationsQueryKey,
  updateApplicationMutation,
  saveWizardStepMutation,
  saveGuardiansMutation,
  saveAddressesMutation,
  saveSiblingsMutation,
  saveApplicationDocumentsMutation,
  listAddressesOptions,
  listGuardiansOptions,
  createChildMutation,
  updateChildMutation,
  getChildOptions,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import type {
  Gender,
  Nationality,
  MediumOfInstruction,
  Religion,
  Child,
  G1Category,
  G1Application,
} from "@/lib/api-client/types.gen"
import { Button } from "@/components/ui/button"
import { WizardStepChild } from "./wizard-step-child"
import type { ChildFormData } from "./wizard-step-child"
import { WizardStepGuardian } from "./wizard-step-guardian"
import type { GuardianFormData } from "./wizard-step-guardian"
import { WizardStepAddress } from "./wizard-step-address"
import type { AddressEntryValue } from "./wizard-step-address"
import { WizardStepSiblings } from "./wizard-step-siblings"
import { WizardStepDocuments } from "./wizard-step-documents"
import type { DocumentFormData } from "./wizard-step-documents"
import { WizardStepReview } from "./wizard-step-review"
import { WizardSidebar } from "./wizard-sidebar"

export const SEEDED_SCHOOL_ID = "00000000-0000-0000-0000-000000000001"

const STEPS = [
  "Child",
  "Guardian",
  "Address",
  "Siblings",
  "Documents",
  "Review & Lock",
]

export function WizardShell() {
  const params = useParams({
    from: "/_authenticated/student-management/enrollment/g1/$enrollment_id",
  })
  const navigate = useNavigate()
  const enrollmentId = params.enrollment_id
  const [step, setStep] = useState(1)
  const [savedSteps, setSavedSteps] = useState<number>(0)
  const initialStepSet = useRef(false)

  const { data: application } = useQuery(
    getApplicationOptions({ path: { id: enrollmentId }, client: apiClient })
  )

  const { data: guardians } = useQuery(
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

  useEffect(() => {
     if (!application) return
     const dbStep = application.wizard_step ?? 0
     if (dbStep >= 0) {
       setSavedSteps((prev) => Math.max(prev, dbStep))
     }
     if (!initialStepSet.current && dbStep >= 1) {
       setStep(Math.min(dbStep + 1, STEPS.length))
       initialStepSet.current = true
     }
   }, [application])

  const [childId, setChildId] = useState<string | null>(null)

  const { data: childRecord } = useQuery({
    ...getChildOptions({ path: { id: application?.child_id ?? "" }, client: apiClient }),
    enabled: !!application?.child_id,
  })

  const [childData, setChildData] = useState<ChildFormData>({
    full_name: "",
    name_with_initials: "",
    date_of_birth: "",
    gender: "Male" as Gender,
    nationality: "SriLankan" as Nationality,
    religion: "",
    birth_certificate_number: "",
    medium_of_instruction: "Sinhala" as MediumOfInstruction,
    category: "",
    overseas_arrival_date: "",
  })

  useEffect(() => {
    if (childRecord) {
      setChildId(childRecord.id)
      setChildData({
        full_name: childRecord.full_name,
        name_with_initials: childRecord.name_with_initials,
        date_of_birth: childRecord.date_of_birth,
        gender: childRecord.gender,
        nationality: childRecord.nationality,
        religion: childRecord.religion ?? "",
        birth_certificate_number: childRecord.birth_certificate_number ?? "",
        medium_of_instruction: childRecord.medium_of_instruction,
        category: "" as string,
        overseas_arrival_date: "",
      })
    }
  }, [childRecord])

  const [guardianIds, setGuardianIds] = useState<GuardianFormData>([])
  const initialGuardianLoad = useRef(false)
  const [selectedAddressEntries, setSelectedAddressEntries] = useState<
    AddressEntryValue[]
  >([])
  const initialAddressLoad = useRef(false)
  const [selectedSiblingIds, setSelectedSiblingIds] = useState<string[]>([])
  const initialSiblingLoad = useRef(false)
  const [documentData, setDocumentData] = useState<DocumentFormData[]>([])
  const initialDocLoad = useRef(false)

  useEffect(() => {
    if (applicationGuardianIds && !initialGuardianLoad.current) {
      initialGuardianLoad.current = true
      setGuardianIds(applicationGuardianIds.guardian_ids)
    }
  }, [applicationGuardianIds])

  useEffect(() => {
    if (applicationAddressEntries && !initialAddressLoad.current) {
      initialAddressLoad.current = true
      setSelectedAddressEntries(
        applicationAddressEntries.addresses.map((a) => ({
          address_id: a.address_id,
          address_type: a.address_type,
          residence_type: a.residence_type,
          is_primary: a.is_primary,
        }))
      )
    }
  }, [applicationAddressEntries])

  useEffect(() => {
    if (applicationSiblingIds && !initialSiblingLoad.current) {
      initialSiblingLoad.current = true
      setSelectedSiblingIds(applicationSiblingIds.sibling_ids)
    }
  }, [applicationSiblingIds])

  useEffect(() => {
    if (serverDocuments && !initialDocLoad.current) {
      initialDocLoad.current = true
      setDocumentData(
        serverDocuments.documents.map((d) => ({
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
      )
    }
  }, [serverDocuments])

  const updateApplication = useMutation(
    updateApplicationMutation({ client: apiClient })
  )

  const createChild = useMutation(createChildMutation({ client: apiClient }))
  const updateChild = useMutation(updateChildMutation({ client: apiClient }))

  const saveStep = useMutation(saveWizardStepMutation({ client: apiClient }))

  const saveGuardians = useMutation(
    saveGuardiansMutation({ client: apiClient })
  )

  const saveAddresses = useMutation(
    saveAddressesMutation({ client: apiClient })
  )

  const saveSiblings = useMutation(saveSiblingsMutation({ client: apiClient }))

  const saveAppDocuments = useMutation(
    saveApplicationDocumentsMutation({ client: apiClient })
  )

  const autoSaveStep = useCallback(
    async (stepNum: number) => {
      await saveStep.mutateAsync({
        path: { id: enrollmentId },
        body: { wizard_step: stepNum },
      })
      setSavedSteps((prev) => Math.max(prev, stepNum))
      queryClient.invalidateQueries({
        queryKey: getApplicationQueryKey({
          path: { id: enrollmentId },
          client: apiClient,
        }),
      })
    },
    [enrollmentId, saveStep]
  )

  const saveChildRecord = useCallback(
    async (data: ChildFormData) => {
      const childPayload = {
        full_name: data.full_name,
        name_with_initials: data.name_with_initials,
        date_of_birth: data.date_of_birth,
        gender: data.gender as Gender,
        nationality: data.nationality as Nationality,
        religion: (data.religion || null) as Religion | null,
        birth_certificate_number: data.birth_certificate_number || null,
        medium_of_instruction: data.medium_of_instruction as MediumOfInstruction,
      } satisfies Omit<Child, 'id' | 'created_at' | 'student_id' | 'disability_status' | 'disability_type' | 'photo_url' | 'updated_at'>

      try {
        let savedChild: Child
        if (childId) {
          savedChild = await updateChild.mutateAsync({
            path: { id: childId },
            body: { ...childPayload, id: childId },
          })
        } else {
          savedChild = await createChild.mutateAsync({
            body: childPayload as Child,
          })
          setChildId(savedChild.id)
        }

        const appBody = {
          child_id: savedChild.id,
          category: (data.category || undefined) as G1Category | undefined,
          overseas_arrival_date: data.overseas_arrival_date || null,
          school_id: SEEDED_SCHOOL_ID,
          batch_id: application?.batch_id ?? "",
          wizard_step: 1,
          age_eligibility_verified: false,
          alternative_age_certificate: false,
          birth_certificate_verified: false,
          category_verified: false,
          interview_completed: false,
          residence_verified: false,
        } satisfies G1Application
        await updateApplication.mutateAsync({
          path: { id: enrollmentId },
          body: appBody,
        })
        setSavedSteps(1)
        queryClient.invalidateQueries({
          queryKey: getApplicationQueryKey({
            path: { id: enrollmentId },
            client: apiClient,
          }),
        })
      } catch {
        // silent fail for auto-save
      }
    },
    [enrollmentId, childId, updateApplication, createChild, updateChild, application]
  )

  const handleComplete = useCallback(async () => {
    try {
      const completeBody = {
        school_id: SEEDED_SCHOOL_ID,
        enrollment_status: "Completed",
        batch_id: application?.batch_id ?? "",
        wizard_step: 6,
        age_eligibility_verified: false,
        alternative_age_certificate: false,
        birth_certificate_verified: false,
        category_verified: false,
        interview_completed: false,
        residence_verified: false,
      } satisfies G1Application
      await updateApplication.mutateAsync({
        path: { id: enrollmentId },
        body: completeBody,
      })
      queryClient.invalidateQueries({
        queryKey: listApplicationsQueryKey({ client: apiClient }),
      })
       setSavedSteps(6)
        toast.success("Enrollment completed. Awaiting processing.")
        navigate({ to: "/student-management/enrollment/g1" })
    } catch (err) {
      toastApiError(err, "Failed to complete enrollment")
    }
  }, [enrollmentId, updateApplication, application, navigate])

  const selectedGuardians = (guardians ?? []).filter((g) =>
    guardianIds.includes(g.id)
  )

  const goToStep = (s: number) => {
    if (s !== step && s <= savedSteps + 1) setStep(s)
  }

  return (
    <div className="flex size-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/student-management/enrollment/g1" })}
        >
          &larr; Back
        </Button>
        <h1 className="text-xl font-bold">Enrollment Wizard</h1>
      </div>

      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const isActive = step === stepNum
          const isCompleted = stepNum <= savedSteps
          const isLocked = stepNum > savedSteps + 1
          return (
            <div key={label} className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={!isActive && isLocked}
                onClick={() => goToStep(stepNum)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "border-primary font-medium text-primary"
                    : isLocked
                      ? "cursor-not-allowed border-dashed border-muted-foreground/20 text-muted-foreground/40"
                      : isCompleted
                        ? "cursor-pointer border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                        : "border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary/70"
                }`}
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isLocked
                        ? "bg-muted/50 text-muted-foreground/40"
                        : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted
                    ? "\u2713"
                    : isActive
                      ? stepNum
                      : isLocked
                        ? "\u2715"
                        : stepNum}
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
        <>
            <WizardSidebar
              currentStep={step}
              childData={childData}
              enrollmentId={enrollmentId}
              schoolId={SEEDED_SCHOOL_ID}
              selectedGuardianIds={guardianIds}
              onGuardianSelect={(id) => setGuardianIds((prev) => [...prev, id])}
              onGuardianDeselect={(id) =>
                setGuardianIds((prev) => prev.filter((s) => s !== id))
              }
              selectedAddressIds={selectedAddressEntries.map(
                (a) => a.address_id
              )}
              onAddressSelect={(id) => {
                if (
                  !selectedAddressEntries.some(
                    (a) => a.address_id === id
                  )
                ) {
                  setSelectedAddressEntries((prev) => [
                    ...prev,
                    {
                      address_id: id,
                      address_type: "Permanent",
                      residence_type: "Owned",
                      is_primary: prev.length === 0,
                    },
                  ])
                }
              }}
              onAddressDeselect={(id) => {
                setSelectedAddressEntries((prev) => {
                  const next = prev.filter((a) => a.address_id !== id)
                  if (next.length > 0 && !next.some((a) => a.is_primary)) {
                    return next.map((a, i) =>
                      i === 0 ? { ...a, is_primary: true } : a
                    )
                  }
                  return next
                })
              }}
              selectedSiblingIds={selectedSiblingIds}
              onSiblingSelect={(id) =>
                setSelectedSiblingIds((prev) =>
                  prev.includes(id) ? prev : [...prev, id]
                )
              }
              onSiblingDeselect={(id) =>
                setSelectedSiblingIds((prev) => prev.filter((s) => s !== id))
              }
              documents={documentData}
            />

            <div className="flex-1">
              {step === 1 && (
                <WizardStepChild
                  defaultValues={childData}
                  onSave={async (data) => {
                    setChildData(data)
                    await saveChildRecord(data)
                  }}
                  onNext={() => setStep(2)}
                />
              )}
              {step === 2 && (
                <WizardStepGuardian
                  selectedIds={guardianIds}
                  onDeselect={(id) =>
                    setGuardianIds((prev) => prev.filter((s) => s !== id))
                  }
                  onSave={async (ids) => {
                    setGuardianIds(ids)
                    await autoSaveStep(2)
                    try {
                      if (ids.length > 0) {
                        await saveGuardians.mutateAsync({
                          path: { id: enrollmentId },
                          body: { guardian_ids: ids },
                        })
                      }
                      queryClient.invalidateQueries({
                        queryKey: getApplicationGuardiansQueryKey({
                          path: { id: enrollmentId },
                          client: apiClient,
                        }),
                      })
                      toast.success("Guardians saved")
                    } catch (err) {
                      toastApiError(err, "Failed to save guardians")
                    }
                  }}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              )}
              {step === 3 && (
                <WizardStepAddress
                  selectedAddresses={selectedAddressEntries}
                  onUpdate={(id, field, value) => {
                    setSelectedAddressEntries((prev) =>
                      prev.map((a) =>
                        a.address_id === id
                          ? { ...a, [field]: value }
                          : a
                      )
                    )
                  }}
                  onDeselect={(id) => {
                    setSelectedAddressEntries((prev) => {
                      const next = prev.filter(
                        (a) => a.address_id !== id
                      )
                      if (next.length > 0 && !next.some((a) => a.is_primary)) {
                        return next.map((a, i) =>
                          i === 0 ? { ...a, is_primary: true } : a
                        )
                      }
                      return next
                    })
                  }}
                  onSave={async (addresses) => {
                    setSelectedAddressEntries(addresses)
                    await autoSaveStep(3)
                    try {
                      if (addresses.length > 0) {
                        await saveAddresses.mutateAsync({
                          path: { id: enrollmentId },
                          body: { addresses },
                        })
                      }
                      queryClient.invalidateQueries({
                        queryKey: getApplicationAddressesQueryKey({
                          path: { id: enrollmentId },
                          client: apiClient,
                        }),
                      })
                      toast.success("Addresses saved")
                    } catch (err) {
                      toastApiError(err, "Failed to save addresses")
                    }
                  }}
                  onBack={() => setStep(2)}
                  onNext={() => setStep(4)}
                />
              )}
              {step === 4 && (
                <WizardStepSiblings
                  selectedStudentIds={selectedSiblingIds}
                  onDeselect={(id) =>
                    setSelectedSiblingIds((prev) =>
                      prev.filter((s) => s !== id)
                    )
                  }
                  onSave={async (ids) => {
                    setSelectedSiblingIds(ids)
                    await autoSaveStep(4)
                    try {
                      if (ids.length > 0) {
                        await saveSiblings.mutateAsync({
                          path: { id: enrollmentId },
                          body: { student_ids: ids },
                        })
                      }
                      queryClient.invalidateQueries({
                        queryKey: getApplicationSiblingsQueryKey({
                          path: { id: enrollmentId },
                          client: apiClient,
                        }),
                      })
                      toast.success("Siblings saved")
                    } catch (err) {
                      toastApiError(err, "Failed to save siblings")
                    }
                  }}
                  onBack={() => setStep(3)}
                  onNext={() => setStep(5)}
                />
              )}
              {step === 5 && (
                <WizardStepDocuments
                  defaultValues={documentData}
                  guardians={selectedGuardians}
                  onSave={async (data) => {
                    setDocumentData(data)
                    const uploadedDocs = data.filter(
                      (d) => d.status === "uploaded" && d.file_key
                    )
                    try {
                      await saveAppDocuments.mutateAsync({
                        path: { id: enrollmentId },
                        body: {
                          documents: uploadedDocs.map((d) => ({
                            doc_type: d.doc_type,
                            file_url: d.file_url,
                            file_key: d.file_key!,
                            content_type: d.content_type || null,
                            file_size: (d.file_size ?? null) as unknown as
                              bigint | null,
                          })),
                        },
                      })
                      queryClient.invalidateQueries({
                        queryKey: getApplicationDocumentsOptions({
                          path: { id: enrollmentId },
                          client: apiClient,
                        }).queryKey,
                      })
                      toast.success("Documents saved")
                    } catch (err) {
                      toastApiError(err, "Failed to save documents. Please try again.")
                    }
                    await autoSaveStep(5)
                  }}
                  onBack={() => setStep(4)}
                  onNext={() => setStep(6)}
                  onDocumentsChange={setDocumentData}
                />
              )}
              {step === 6 && (
                <WizardStepReview
                  child={childData}
                  guardians={selectedGuardians}
                  school={{
                    school_id: SEEDED_SCHOOL_ID,
                    school_name_si: "St. Aloysius College, Galle",
                    school_type: "1AB",
                    category: "Urban",
                    quota: 100,
                  }}
                  selectedAddresses={selectedAddressEntries}
                  addresses={allAddresses}
                  siblingIds={selectedSiblingIds}
                  documents={documentData}
                  onBack={() => setStep(5)}
                  onComplete={handleComplete}
                />
              )}
             </div>
           </>
       </div>
     </div>
   )
 }
