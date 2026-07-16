"use client"

import { createFileRoute } from "@tanstack/react-router"
import { SignupForm } from "@/components/signup-form"

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <SignupForm />
    </div>
  )
}
