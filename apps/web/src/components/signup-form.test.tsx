import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SignupForm } from "./signup-form"
import { useAuth } from "@/lib/auth"
import { useNavigate } from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ login: vi.fn() }),
}))

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

const queryClient = new QueryClient()

describe("SignupForm", () => {
  it("should prevent default form submission", async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SignupForm />
      </QueryClientProvider>
    )
    const form = container.querySelector("form")
    
    // Create a mock for preventDefault
    const preventDefault = vi.fn()
    
    // Trigger submit
    fireEvent.submit(form!, {
      preventDefault,
    })

    // If our code is working, preventDefault should be called
    expect(preventDefault).toHaveBeenCalled()
  })
})
