"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { logout as apiLogout } from "./api-client"
import {
  getAccessToken,
  getRefreshToken,
  setAuthCookies,
  deleteAuthCookies,
} from "./cookies"

const TOKEN_KEY = "access_token"
const REFRESH_KEY = "refresh_token"

interface AuthContextValue {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken: string, expiresAt: number) => void
  logout: () => Promise<void>
  withAuthRetry: <T>(
    fn: () => Promise<{ data?: T; error?: unknown; response?: Response }>
  ) => Promise<T>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  useEffect(() => {
    const storedAccess = localStorage.getItem(TOKEN_KEY)
    const storedRefresh = localStorage.getItem(REFRESH_KEY)
    if (storedAccess) {
      setAccessToken(storedAccess)
    } else {
      ;(async () => {
        const cookieAccess = await getAccessToken()
        if (cookieAccess) setAccessToken(cookieAccess)
      })()
    }
    if (storedRefresh) {
      setRefreshToken(storedRefresh)
    } else {
      ;(async () => {
        const cookieRefresh = await getRefreshToken()
        if (cookieRefresh) setRefreshToken(cookieRefresh)
      })()
    }
  }, [])

  const login = async (access: string, refresh: string, expiresAt: number) => {
    const refreshExpiresAt = expiresAt + 60 * 60 * 24 * 30
    await setAuthCookies(access, refresh, expiresAt, refreshExpiresAt)
    setAccessToken(access)
    setRefreshToken(refresh)
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  }

  const logout = async () => {
    try {
      if (refreshToken) {
        await apiLogout({ body: { refresh_token: refreshToken } })
      }
    } catch {
      // ignore logout API errors
    }
    await deleteAuthCookies()
    setAccessToken(null)
    setRefreshToken(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }

  const withAuthRetry = async <T,>(
    fn: () => Promise<{ data?: T; error?: unknown; response?: Response }>
  ): Promise<T> => {
    const result = await fn()

    if (
      result.error &&
      result.response?.status === 401 &&
      refreshToken
    ) {
      const newAccess = await getAccessToken()
      const newRefresh = await getRefreshToken()
      if (newAccess && newRefresh) {
        setAccessToken(newAccess)
        setRefreshToken(newRefresh)

        const retry = await fn()
        if (retry.data) return retry.data
      }
      throw new Error("Session expired")
    }

    if (result.error) throw result.error
    return result.data!
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
        login,
        logout,
        withAuthRetry,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
