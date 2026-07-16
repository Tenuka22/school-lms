import { createClient, createConfig } from "./api-client/client"
import { env } from "./env"
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  deleteAuthCookies,
  getCookieExpiry,
} from "./cookies"
import { refresh as apiRefresh } from "./api-client"

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  const refreshToken = await getRefreshToken()
  if (!refreshToken) return null

  refreshPromise = (async () => {
    try {
      const result = await apiRefresh({ body: { refresh_token: refreshToken } })
      if (result.data) {
        const refreshExpiresAt = Date.now() / 1000 + 60 * 60 * 24 * 30
        await setAuthCookies(
          result.data.access_token,
          result.data.refresh_token,
          undefined,
          refreshExpiresAt
        )
        return result.data.access_token
      }
    } catch {
      // ignore refresh errors
    }
    await deleteAuthCookies()
    return null
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function customFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const accessToken = await getAccessToken()
  const expiresAt = getCookieExpiry("access_token")

  if (accessToken && expiresAt && Date.now() > expiresAt - 5000) {
    const newToken = await refreshAccessToken()
    if (!newToken) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
  }

  const headers = new Headers(init.headers)
  const token = await getAccessToken()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return fetch(input, {
    ...init,
    headers,
  })
}

export const client = createClient(
  createConfig({
    baseUrl: env.VITE_PUBLIC_API_URL,
    fetch: customFetch,
  })
)
