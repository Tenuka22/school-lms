import { createClient, createConfig } from "@/lib/api-client/client"
import { resolveTokenAction } from "@/lib/api/auth"
import { env } from "@/lib/env"

export const apiClient = createClient(
  createConfig({
    baseUrl: env.VITE_PUBLIC_API_URL,
    auth: async () => {
      const result = await resolveTokenAction()
      return result.token ?? undefined
    },
  })
)
