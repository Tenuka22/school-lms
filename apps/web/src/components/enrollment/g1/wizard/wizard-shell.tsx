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
  getApplicationDocumentsQueryKey,
  listApplicationsQueryKey,
  updateApplicationMutation,
  saveWizardStepMutation,
  saveGuardiansMutation,
  saveAddressesMutation,
  saveSiblingsMutation,
  saveApplicationDocumentsMutation,
  submitApplicationMutation,
  listAddressesOptions,
  listGuardiansOptions,
  createChildMutation,
  updateChildMutation,
  getChildOptions,
  getChildQueryKey,
  meOptions,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { queryClient } from "@/router"
import type {
  Gender,
  Nationality,
  MediumOfInstruction,
  Religion,
  Child,
  G1Category,
} from "@/lib/api-client/types.gen"
import { Button } from "@/components/ui/button"
import { IconLock } from "@tabler/icons-react"
import { WizardStepChild } from "./wizard-step-child"
import type { ChildFormData } from "./wizard-step-child"
import { WizardStepGuardian } from "./wizard-step-guardian"
import type { GuardianFormData } from "./wizard-step-guardian"
import { WizardStepElectoral } from "./wizard-step-electoral"
import type { ElectoralEntry } from "./wizard-step-electoral"
import { WizardStepAddress } from "./wizard-step-address"
import type { AddressEntryValue } from "./wizard-step-address"
import { WizardStepSchools } from "./wizard-step-schools"
import { WizardStepSiblings } from "./wizard-step-siblings"
import { WizardStepDocuments } from "./wizard-step-documents"
import type { DocumentFormData } from "./wizard-step-documents"
import { WizardStepReview } from "./wizard-step-review"
import { WizardSidebar } from "./wizard-sidebar"
import { LockedApplicationDialog } from "./locked-application-dialog"

export const SEEDED_SCHOOL_ID = "00000000-0000-0000-0000-000000000001"

const STEPS = [
  "Child",
  "Guardian",
  "Electoral",
  "Address",
  "School Preferences",
  "Siblings",
  "Documents",
  "Review & Lock",
]

export function WizardShell() {
  const params = useParams({
    from: "/_authenticated/student-management/enrollment/g1/$enrollment_id/",
  })
  const navigate = useNavigate()
  const enrollmentId = params.enrollment_id
  const [step, setStep] = useState(1)
  const initialStepSet = useRef(false)

  const { data: application } = useQuery(
    getApplicationOptions({ path: { id: enrollmentId }, client: apiClient })
  )

  const { data: currentUser } = useQuery(meOptions({ client: apiClient }))

  const isLocked =
    application?.enrollment_status !== "Draft" &&
    application?.enrollment_status !== "Pending" &&
    application?.enrollment_status !== undefined
  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "superadmin"
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false)
  const [pendingStep, setPendingStep] = useState<number | null>(null)

  const savedSteps = application?.wizard_step ?? 0

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

  const { data: childRecord } = useQuery({
    ...getChildOptions({
      path: { id: application?.child_id ?? "" },
      client: apiClient,
    }),
    enabled: !!application?.child_id,
  })

  const [childData, setChildData] = useState<ChildFormData>({
    full_name: "",
    name_with_initials: "",
    name_with_initials_en: "",
    date_of_birth: "",
    gender: "Male" as Gender,
    nationality: "SriLankan" as Nationality,
    religion: undefined as unknown as Religion,
    birth_certificate_number: "",
    medium_of_instruction: "Sinhala" as MediumOfInstruction,
  })

  useEffect(() => {
    if (!application) return
    if (!initialStepSet.current) {
      if (isLocked) {
        setStep(STEPS.length)
      } else if (savedSteps >= 1) {
        setStep(Math.min(savedSteps + 1, STEPS.length))
      }
      initialStepSet.current = true
    }
    if (application.category) setCategory(application.category)
    if (application.overseas_arrival_date)
      setOverseasArrivalDate(application.overseas_arrival_date)
  }, [application])

  useEffect(() => {
    if (childRecord) {
      setChildData({
        full_name: childRecord.full_name,
        name_with_initials: childRecord.name_with_initials,
        name_with_initials_en: childRecord.name_with_initials_en ?? "",
        date_of_birth: childRecord.date_of_birth,
        gender: childRecord.gender,
        nationality: childRecord.nationality,
        religion: childRecord.religion ?? undefined,
        birth_certificate_number: childRecord.birth_certificate_number ?? "",
        medium_of_instruction: childRecord.medium_of_instruction,
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
  const [electoralEntries, setElectoralEntries] = useState<ElectoralEntry[]>([])
  const initialElectoralLoad = useRef(false)
  const [category, setCategory] = useState<string>("")
  const [overseasArrivalDate, setOverseasArrivalDate] = useState<string>("")
  const [preferredSchoolIds, setPreferredSchoolIds] = useState<string[]>([])
  const initialSchoolLoad = useRef(false)
  const [closerSchoolExists, setCloserSchoolExists] = useState(false)

  useEffect(() => {
    if (
      application &&
      !initialElectoralLoad.current &&
      electoralEntries.length === 0
    ) {
      if (
        application.electoral_year ||
        application.polling_district ||
        application.gn_name
      ) {
        initialElectoralLoad.current = true
        setElectoralEntries([
          {
            id: crypto.randomUUID(),
            electoral_year:
              application.electoral_year ?? new Date().getFullYear() - 1,
            polling_district: application.polling_district ?? "",
            polling_division: application.polling_division ?? "",
            gn_name: application.gn_name ?? "",
            gn_number: application.gn_number ?? "",
            polling_area: application.polling_area ?? "",
            village_street: application.village_street ?? "",
            voter_names: (Array.isArray(application.voter_names)
              ? application.voter_names
              : []) as string[],
            household_head_name: application.household_head_name ?? "",
          },
        ])
      }
    }
  }, [application])

  useEffect(() => {
    if (application && !initialSchoolLoad.current) {
      initialSchoolLoad.current = true
      if (application.preferred_school_ids) {
        const ids = Array.isArray(application.preferred_school_ids)
          ? application.preferred_school_ids
          : []
        setPreferredSchoolIds(ids as string[])
      }
      if (
        application.closer_school_exists !== undefined &&
        application.closer_school_exists !== null
      ) {
        setCloserSchoolExists(application.closer_school_exists)
      }
    }
  }, [application])

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

  const submitApp = useMutation(
    submitApplicationMutation({ client: apiClient })
  )

  const autoSaveStep = useCallback(
    async (stepNum: number) => {
      const appKey = getApplicationQueryKey({
        path: { id: enrollmentId },
        client: apiClient,
      })
      queryClient.setQueryData(appKey, (old: any) =>
        old ? { ...old, wizard_step: stepNum } : old
      )
      await saveStep.mutateAsync({
        path: { id: enrollmentId },
        body: { wizard_step: stepNum },
      })
      queryClient.invalidateQueries({ queryKey: appKey })
    },
    [enrollmentId, saveStep]
  )

  const handleComplete = useCallback(
    async (reviewData: {
      category: string
      overseas_arrival_date: string
      declaration_agreed: boolean
    }) => {
      try {
        const appKey = getApplicationQueryKey({
          path: { id: enrollmentId },
          client: apiClient,
        })
        queryClient.setQueryData(appKey, (old: any) =>
          old ? { ...old, wizard_step: 8 } : old
        )
        await updateApplication.mutateAsync({
          path: { id: enrollmentId },
          body: {
            wizard_step: 8,
            category: (reviewData.category || undefined) as
              G1Category | undefined,
            overseas_arrival_date: reviewData.overseas_arrival_date || null,
            declaration_agreed: reviewData.declaration_agreed,
            preferred_school_ids:
              preferredSchoolIds.length > 0 ? preferredSchoolIds : null,
            closer_school_exists: closerSchoolExists,
          },
        })
        await submitApp.mutateAsync({
          path: { id: enrollmentId },
        })
        queryClient.invalidateQueries({
          queryKey: listApplicationsQueryKey({ client: apiClient }),
        })
        toast.success("Enrollment completed. Awaiting processing.")
        navigate({ to: "/student-management/enrollment/g1" })
      } catch (err) {
        toastApiError(err, "Failed to complete enrollment")
      }
    },
    [
      enrollmentId,
      updateApplication,
      submitApp,
      navigate,
      preferredSchoolIds,
      closerSchoolExists,
    ]
  )

  const selectedGuardians = (guardians ?? []).filter((g) =>
    guardianIds.includes(g.id)
  )

  const goToStep = (s: number) => {
    if (s !== step && s <= savedSteps + 1) {
      if (isLocked && !isAdmin) {
        setPendingStep(s)
        setLockedDialogOpen(true)
      } else {
        setStep(s)
      }
    }
  }

  const handleOverrideLock = () => {
    if (pendingStep !== null) {
      setStep(pendingStep)
      setPendingStep(null)
    }
    setLockedDialogOpen(false)
    toast.warning("Admin override: Editing locked application")
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

      {isLocked && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-800 dark:bg-amber-950">
          <IconLock className="size-4 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            This application has been submitted and is locked.
            {isAdmin && " Admin override is enabled."}
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 pb-2">
        {STEPS.map((label, i) => {
          const stepNum = i + 1
          const isActive = step === stepNum
          const isCompleted = isLocked || stepNum <= savedSteps
          const isFuture = !isLocked && stepNum > savedSteps + 1
          return (
            <div key={label} className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={!isActive && isFuture}
                onClick={() => goToStep(stepNum)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "border-primary font-medium text-primary"
                    : isFuture
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
                      : isFuture
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
                      : isFuture
                        ? "\u2715"
                        : stepNum}
                </span>
                {!isCompleted && !isLocked && label}
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
            electoralEntries={electoralEntries}
            selectedGuardianIds={guardianIds}
            onGuardianSelect={(id) => setGuardianIds((prev) => [...prev, id])}
            onGuardianDeselect={(id) =>
              setGuardianIds((prev) => prev.filter((s) => s !== id))
            }
            selectedAddressIds={selectedAddressEntries.map((a) => a.address_id)}
            onAddressSelect={(id) => {
              if (!selectedAddressEntries.some((a) => a.address_id === id)) {
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
            preferredSchoolIds={preferredSchoolIds}
            closerSchoolExists={closerSchoolExists}
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
                excludeChildId={application?.child_id}
                onSave={async (data) => {
                  const childPayload = {
                    full_name: data.full_name,
                    name_with_initials: data.name_with_initials,
                    name_with_initials_en: data.name_with_initials_en || null,
                    date_of_birth: data.date_of_birth,
                    gender: data.gender,
                    nationality: data.nationality,
                    religion: data.religion || null,
                    birth_certificate_number:
                      data.birth_certificate_number || null,
                    medium_of_instruction: data.medium_of_instruction,
                    status: "Active" as const,
                  } satisfies Omit<
                    Child,
                    | "id"
                    | "created_at"
                    | "student_id"
                    | "disability_status"
                    | "disability_type"
                    | "photo_url"
                    | "updated_at"
                  >

                  let savedChild: Child
                  if (application?.child_id) {
                    savedChild = await updateChild.mutateAsync({
                      path: { id: application.child_id },
                      body: childPayload,
                    })
                  } else {
                    savedChild = await createChild.mutateAsync({
                      body: childPayload,
                    })
                  }

                  await updateApplication.mutateAsync({
                    path: { id: enrollmentId },
                    body: {
                      child_id: savedChild.id,
                    },
                  })

                  await autoSaveStep(1)

                  queryClient.invalidateQueries({
                    queryKey: getChildQueryKey({
                      path: { id: savedChild.id },
                      client: apiClient,
                    }),
                  })

                  setChildData(data)
                  toast.success("Child saved")
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
                  if (ids.length > 0) {
                    await saveGuardians.mutateAsync({
                      path: { id: enrollmentId },
                      body: { guardian_ids: ids },
                    })
                  }
                  await autoSaveStep(2)
                  queryClient.invalidateQueries({
                    queryKey: getApplicationGuardiansQueryKey({
                      path: { id: enrollmentId },
                      client: apiClient,
                    }),
                  })
                  toast.success("Guardians saved")
                }}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}
            {step === 3 && (
              <WizardStepElectoral
                entries={electoralEntries}
                onChange={setElectoralEntries}
                onBack={() => setStep(2)}
                onSave={async (entries) => {
                  setElectoralEntries(entries)
                  if (entries.length > 0) {
                    const first = entries[0]
                    await updateApplication.mutateAsync({
                      path: { id: enrollmentId },
                      body: {
                        electoral_year: first.electoral_year || null,
                        polling_district: first.polling_district || null,
                        polling_division: first.polling_division || null,
                        gn_name: first.gn_name || null,
                        gn_number: first.gn_number || null,
                        polling_area: first.polling_area || null,
                        village_street: first.village_street || null,
                        household_head_name: first.household_head_name || null,
                        voter_names:
                          first.voter_names.length > 0
                            ? first.voter_names
                            : null,
                      },
                    })
                  }
                  await autoSaveStep(3)
                  toast.success("Electoral data saved")
                }}
                onNext={() => setStep(4)}
              />
            )}
            {step === 4 && (
              <WizardStepAddress
                selectedAddresses={selectedAddressEntries}
                onUpdate={(id, field, value) => {
                  setSelectedAddressEntries((prev) =>
                    prev.map((a) =>
                      a.address_id === id ? { ...a, [field]: value } : a
                    )
                  )
                }}
                onDeselect={(id) => {
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
                onSave={async (addresses) => {
                  setSelectedAddressEntries(addresses)
                  if (addresses.length > 0) {
                    await saveAddresses.mutateAsync({
                      path: { id: enrollmentId },
                      body: { addresses },
                    })
                  }
                  await autoSaveStep(4)
                  queryClient.invalidateQueries({
                    queryKey: getApplicationAddressesQueryKey({
                      path: { id: enrollmentId },
                      client: apiClient,
                    }),
                  })
                  toast.success("Addresses saved")
                }}
                onBack={() => setStep(3)}
                onNext={() => setStep(5)}
              />
            )}
            {step === 5 && (
              <WizardStepSchools
                preferredSchoolIds={preferredSchoolIds}
                closerSchoolExists={closerSchoolExists}
                onChangePreferredSchools={setPreferredSchoolIds}
                onChangeCloserSchool={setCloserSchoolExists}
                onBack={() => setStep(4)}
                onSave={async () => {
                  await updateApplication.mutateAsync({
                    path: { id: enrollmentId },
                    body: {
                      preferred_school_ids:
                        preferredSchoolIds.length > 0
                          ? preferredSchoolIds
                          : null,
                      closer_school_exists: closerSchoolExists,
                    },
                  })
                  await autoSaveStep(5)
                }}
                onNext={() => setStep(6)}
              />
            )}
            {step === 6 && (
              <WizardStepSiblings
                selectedStudentIds={selectedSiblingIds}
                onDeselect={(id) =>
                  setSelectedSiblingIds((prev) => prev.filter((s) => s !== id))
                }
                onSave={async (ids) => {
                  setSelectedSiblingIds(ids)
                  if (ids.length > 0) {
                    await saveSiblings.mutateAsync({
                      path: { id: enrollmentId },
                      body: { student_ids: ids },
                    })
                  }
                  await autoSaveStep(6)
                  queryClient.invalidateQueries({
                    queryKey: getApplicationSiblingsQueryKey({
                      path: { id: enrollmentId },
                      client: apiClient,
                    }),
                  })
                  toast.success("Siblings saved")
                }}
                onBack={() => setStep(5)}
                onNext={() => setStep(7)}
              />
            )}
            {step === 7 && (
              <WizardStepDocuments
                defaultValues={documentData}
                guardians={selectedGuardians}
                onSave={async (data) => {
                  setDocumentData(data)
                  const uploadedDocs = data.filter(
                    (d) => d.status === "uploaded" && d.file_key
                  )
                  if (uploadedDocs.length > 0) {
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
                  }
                  await autoSaveStep(7)
                  queryClient.invalidateQueries({
                    queryKey: getApplicationDocumentsQueryKey({
                      path: { id: enrollmentId },
                      client: apiClient,
                    }),
                  })
                }}
                onBack={() => setStep(6)}
                onNext={() => setStep(8)}
                onDocumentsChange={setDocumentData}
              />
            )}
            {step === 8 && (
              <WizardStepReview
                child={childData}
                guardians={selectedGuardians}
                school={{
                  school_id: SEEDED_SCHOOL_ID,
                  school_name_si: "St. Aloysius College, Galle",
                }}
                selectedAddresses={selectedAddressEntries}
                addresses={allAddresses}
                siblingIds={selectedSiblingIds}
                documents={documentData}
                preferredSchoolIds={preferredSchoolIds}
                category={category}
                overseasArrivalDate={overseasArrivalDate}
                declarationAgreed={application?.declaration_agreed ?? false}
                onCategoryChange={(cat) => {
                  setCategory(cat)
                  updateApplication.mutateAsync({
                    path: { id: enrollmentId },
                    body: { category: cat as any },
                  })
                }}
                onDeclarationChange={(agreed) => {
                  updateApplication.mutateAsync({
                    path: { id: enrollmentId },
                    body: { declaration_agreed: agreed },
                  })
                }}
                onBack={() => setStep(7)}
                onComplete={handleComplete}
              />
            )}
          </div>
        </>
      </div>

      <LockedApplicationDialog
        open={lockedDialogOpen}
        onOpenChange={setLockedDialogOpen}
        onOverride={handleOverrideLock}
        isAdmin={isAdmin}
      />
    </div>
  )
}
