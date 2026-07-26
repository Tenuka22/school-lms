"use client"

import { createContext, useContext } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FormContext = createContext<any>(null)

export function useBuildForm() {
  const ctx = useContext(FormContext)
  if (!ctx) {
    throw new Error("useBuildForm must be used within a FormBuilder")
  }
  return ctx
}

export { FormContext }
