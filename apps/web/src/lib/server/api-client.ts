import { createClient, createConfig } from "@/lib/api-client/client"
import { refresh as apiRefresh } from "@/lib/api-client"
import { getCookie, setCookie } from "@tanstack/react-start/server"
import {env} from "@/lib/env"

let refreshPromise: Promise<string | undefined> | null = null

async function resolveToken(): Promise<string | undefined> {
  const accessToken = getCookie("access_token")
  if (!accessToken) return undefined

  const expiresAt = getCookie("access_token_expires_at")
  // 5-second buffer before expiry
  if (!expiresAt || Date.now() < Number(expiresAt) * 1000 - 5000) {
    return accessToken
  }

  if (refreshPromise) return refreshPromise

  const refreshToken = getCookie("refresh_token")
  if (!refreshToken) return undefined

  refreshPromise = (async () => {
    try {
      const { data } = await apiRefresh({ body: { refresh_token: refreshToken } })
      if (!data) return undefined

      const newExpiresAt = Number(data.expires_at)
      setCookie("access_token", data.access_token, {
        expires: new Date(newExpiresAt * 1000),
        path: "/",
        sameSite: "lax",
      })
      setCookie("refresh_token", data.refresh_token, {
        expires: new Date((newExpiresAt + 60 * 60 * 24 * 30) * 1000),
        path: "/",
        sameSite: "lax",
      })
      setCookie("access_token_expires_at", String(newExpiresAt), {
        expires: new Date((newExpiresAt + 60 * 60 * 24 * 30) * 1000),
        path: "/",
        sameSite: "lax",
      })

      return data.access_token
    } catch {
      return undefined
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export const serverClient = createClient(
  createConfig({
    baseUrl: env.VITE_PUBLIC_API_URL,
    auth: () => resolveToken(),
  })
)
