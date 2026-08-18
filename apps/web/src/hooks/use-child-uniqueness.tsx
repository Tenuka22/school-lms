"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react"
import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/use-debounce"
import {
  listChildrenOptions,
  listGuardiansOptions,
} from "@/lib/api-client/@tanstack/react-query.gen"
import { apiClient } from "@/lib/api-client"
import type { Child, Guardian } from "@/lib/api-client/types.gen"

export type ChildUniquenessCheckType =
  "birth_certificate_number" | "nic" | "full_name"

export interface ChildUniquenessResult {
  childDuplicates: Child[]
  guardianDuplicates: Guardian[]
  isChecking: boolean
  hasDuplicates: boolean
  blocksSubmit: boolean
}

export function useChildUniqueness(
  value: string,
  checkType: ChildUniquenessCheckType,
  excludeChildId?: string | null,
  enabled: boolean = true
): ChildUniquenessResult {
  const debouncedValue = useDebounce(value, 500)

  const shouldCheckName =
    checkType === "full_name" && debouncedValue.length >= 2
  const shouldCheckNic = checkType === "nic" && debouncedValue.length >= 3
  const shouldCheckBc =
    checkType === "birth_certificate_number" && debouncedValue.length > 0

  const buildChildQuery = () => {
    if (checkType === "birth_certificate_number") {
      return { birth_certificate_number: debouncedValue }
    } else if (checkType === "nic") {
      return { nic: debouncedValue }
    } else if (checkType === "full_name") {
      return { search: debouncedValue }
    }
    return {}
  }

  const { data: childDuplicates = [], isLoading: childLoading } = useQuery({
    ...listChildrenOptions({
      client: apiClient,
      query: buildChildQuery(),
    }),
    enabled: enabled && (shouldCheckName || shouldCheckNic || shouldCheckBc),
    staleTime: 30_000,
  })

  const { data: guardianDuplicates = [], isLoading: guardianLoading } =
    useQuery({
      ...listGuardiansOptions({
        client: apiClient,
        query: { search: debouncedValue },
      }),
      enabled: enabled && (shouldCheckName || shouldCheckNic),
      staleTime: 30_000,
    })

  const filteredChild = excludeChildId
    ? childDuplicates.filter((d) => d.id !== excludeChildId)
    : childDuplicates

  const isChecking = childLoading || guardianLoading

  const blocksSubmit =
    (checkType === "birth_certificate_number" &&
      shouldCheckBc &&
      filteredChild.length > 0) ||
    (checkType === "nic" &&
      shouldCheckNic &&
      (filteredChild.length > 0 || guardianDuplicates.length > 0))

  return {
    childDuplicates: filteredChild,
    guardianDuplicates,
    isChecking: isChecking && debouncedValue.length > 0,
    hasDuplicates: filteredChild.length > 0 || guardianDuplicates.length > 0,
    blocksSubmit,
  }
}

// --- Form-level aggregation context ---

interface FormUniquenessContextValue {
  registerField: (fieldName: string, blocks: boolean) => void
  unregisterField: (fieldName: string) => void
  isBlocked: boolean
}

const FormUniquenessContext = createContext<FormUniquenessContextValue>({
  registerField: () => {},
  unregisterField: () => {},
  isBlocked: false,
})

export function FormUniquenessProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [fieldStates, setFieldStates] = useState<Record<string, boolean>>({})

  const registerField = useCallback((fieldName: string, blocks: boolean) => {
    setFieldStates((prev) => ({ ...prev, [fieldName]: blocks }))
  }, [])

  const unregisterField = useCallback((fieldName: string) => {
    setFieldStates((prev) => {
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
  }, [])

  const isBlocked = Object.values(fieldStates).some(Boolean)

  return (
    <FormUniquenessContext.Provider
      value={{ registerField, unregisterField, isBlocked }}
    >
      {children}
    </FormUniquenessContext.Provider>
  )
}

export function useUniquenessBlocked() {
  return useContext(FormUniquenessContext)
}

export function useRegisterUniquenessField(
  fieldName: string,
  blocksSubmit: boolean
) {
  const { registerField, unregisterField } = useUniquenessBlocked()
  useEffect(() => {
    registerField(fieldName, blocksSubmit)
    return () => unregisterField(fieldName)
  }, [fieldName, blocksSubmit, registerField, unregisterField])
}
