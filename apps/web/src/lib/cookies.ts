import { createIsomorphicFn } from "@tanstack/react-start"

function parseClientCookie(name: string): string | null {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? null
  }
  return null
}

export const getAccessToken = createIsomorphicFn()
  .client(() => parseClientCookie("access_token"))
  .server(async () => {
    const { getCookie } = await import("@tanstack/react-start/server")
    return getCookie("access_token") ?? null
  })

export const getRefreshToken = createIsomorphicFn()
  .client(() => parseClientCookie("refresh_token"))
  .server(async () => {
    const { getCookie } = await import("@tanstack/react-start/server")
    return getCookie("refresh_token") ?? null
  })

export const setAuthCookies = createIsomorphicFn()
  .client((accessToken, refreshToken, accessExpiresAt, refreshExpiresAt) => {
    const accessExpires = new Date(accessExpiresAt * 1000).toUTCString()
    document.cookie = `access_token=${encodeURIComponent(accessToken)}; expires=${accessExpires}; path=/; SameSite=Lax`
    const refreshExpires = new Date(refreshExpiresAt * 1000).toUTCString()
    document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; expires=${refreshExpires}; path=/; SameSite=Lax`
  })
  .server(
    async (accessToken, refreshToken, accessExpiresAt, refreshExpiresAt) => {
      const { setCookie } = await import("@tanstack/react-start/server")
      setCookie("access_token", accessToken, {
        expires: new Date(accessExpiresAt * 1000),
      })
      setCookie("refresh_token", refreshToken, {
        expires: new Date(refreshExpiresAt * 1000),
      })
    }
  )

export const deleteAuthCookies = createIsomorphicFn()
  .client(() => {
    document.cookie =
      "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"
    document.cookie =
      "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"
  })
  .server(async () => {
    const { setCookie } = await import("@tanstack/react-start/server")
    setCookie("access_token", "", { expires: new Date(0) })
    setCookie("refresh_token", "", { expires: new Date(0) })
  })

export function getCookieExpiry(name: string): number | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length !== 2) return null
  const cookie = parts.pop()?.split(";").shift() ?? ""
  const expiryMatch = cookie.match(/expires=([^;]+)/)
  if (!expiryMatch) return null
  return new Date(expiryMatch[1]).getTime()
}
