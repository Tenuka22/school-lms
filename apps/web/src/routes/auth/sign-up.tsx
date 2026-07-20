"use client"

import { createFileRoute, redirect } from "@tanstack/react-router"
import { SignupForm } from "@/components/signup-form"
import { getMeAction } from "@/lib/server/auth"

export const Route = createFileRoute("/auth/sign-up")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { user } = await getMeAction()
    if (user) {
      throw redirect({ to: search.redirect ?? "/" })
    }
  },
  component: SignUpPage,
})

function SignUpPage() {
  const { redirect: redirectTo } = Route.useSearch()
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <SignupForm redirect={redirectTo} />
    </div>
  )
}
