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
import { listChildren, listGuardians } from "@/lib/api-client/sdk.gen"
import {
  listChildrenQueryKey,
  listGuardiansQueryKey,
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

  const childQueryKey = [
    ...listChildrenQueryKey({ client: apiClient }),
    checkType,
    debouncedValue,
  ]
  const guardianQueryKey = [
    ...listGuardiansQueryKey({ client: apiClient }),
    checkType,
    debouncedValue,
  ]

  const shouldCheckName =
    checkType === "full_name" && debouncedValue.length >= 2
  const shouldCheckNic = checkType === "nic" && debouncedValue.length >= 3
  const shouldCheckBc =
    checkType === "birth_certificate_number" && debouncedValue.length > 0

  const { data: childDuplicates = [], isLoading: childLoading } = useQuery({
    queryKey: childQueryKey,
    queryFn: async () => {
      const query: Record<string, string> = {}
      if (checkType === "birth_certificate_number") {
        query.birth_certificate_number = debouncedValue
      } else if (checkType === "nic") {
        query.nic = debouncedValue
      } else if (checkType === "full_name") {
        query.search = debouncedValue
      }
      const { data } = await listChildren({
        query,
        client: apiClient,
      })
      return data ?? []
    },
    enabled: enabled && (shouldCheckName || shouldCheckNic || shouldCheckBc),
    staleTime: 30_000,
  })

  const { data: guardianDuplicates = [], isLoading: guardianLoading } =
    useQuery({
      queryKey: guardianQueryKey,
      queryFn: async () => {
        const { data } = await listGuardians({
          query: { search: debouncedValue },
          client: apiClient,
        })
        return data ?? []
      },
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
