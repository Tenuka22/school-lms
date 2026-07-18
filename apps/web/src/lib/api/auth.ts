import { createServerFn } from "@tanstack/react-start"
import { getCookie, setCookie } from "@tanstack/react-start/server"
import { env } from "@/lib/env"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

let refreshPromise: Promise<string | null> | null = null

export const resolveTokenAction = createServerFn({ method: "GET" }).handler(async () => {
  const accessToken = getCookie("access_token")
  if (accessToken) return { token: accessToken }

  const refreshToken = getCookie("refresh_token")
  if (!refreshToken) return { token: null }

  if (refreshPromise) {
    const token = await refreshPromise
    return { token }
  }

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${env.VITE_PUBLIC_API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) return null
      const data = await res.json()

      const accessExp = new Date(Number(data.expires_at) * 1000)
      const refreshExp = new Date(Date.now() + THIRTY_DAYS_MS)

      setCookie("access_token", data.access_token, {
        expires: accessExp,
        path: "/",
        sameSite: "lax",
      })
      setCookie("refresh_token", data.refresh_token, {
        expires: refreshExp,
        path: "/",
        sameSite: "lax",
      })

      return data.access_token as string
    } catch {
      return null
    } finally {
      refreshPromise = null
    }
  })()

  const token = await refreshPromise
  return { token }
})
