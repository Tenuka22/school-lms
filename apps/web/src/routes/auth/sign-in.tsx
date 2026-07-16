"use client"

import { createFileRoute } from "@tanstack/react-router"
import { LoginForm } from "@/components/login-form"

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <LoginForm />
    </div>
  )
}
