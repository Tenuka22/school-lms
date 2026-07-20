import { createServerFn } from "@tanstack/react-start"
import { setCookie, deleteCookie, getCookie } from "@tanstack/react-start/server"
import { login as apiLogin, register as apiRegister, logout as apiLogout, me } from "@/lib/api-client/sdk.gen"
import { apiClient } from "@/lib/api-client"
import { safeParse } from "valibot"
import { vLoginBody, vRegisterBody } from "@/lib/api-client/valibot.gen"

export interface UserInfo {
  email: string
  sub: string
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export const loginAction = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const result = safeParse(vLoginBody, d)
    if (!result.success) throw new Error("Invalid email or password")
    return result.output
  })
  .handler(async (ctx) => {
    const { data } = await apiLogin({
      client: apiClient,
      body: { email: ctx.data.email, password: ctx.data.password },
    })
    if (!data) throw new Error("Login failed")

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

    return { ok: true as const }
  })

export const registerAction = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const result = safeParse(vRegisterBody, d)
    if (!result.success) throw new Error("Invalid email or password")
    return result.output
  })
  .handler(async (ctx) => {
    const { data } = await apiRegister({
      client: apiClient,
      body: { email: ctx.data.email, password: ctx.data.password },
    })
    if (!data) throw new Error("Registration failed")

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

    return { ok: true as const }
  })

export const logoutAction = createServerFn({ method: "POST" })
  .handler(async () => {
    const refreshToken = getCookie("refresh_token")
    if (refreshToken) {
      try {
        await apiLogout({
          client: apiClient,
          body: { refresh_token: refreshToken },
        })
      } catch {
        // ignore logout API errors
      }
    }

    deleteCookie("access_token", { path: "/" })
    deleteCookie("refresh_token", { path: "/" })

    return { ok: true as const }
  })

export const getMeAction = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await me({ client: apiClient })
    if (!data) return { user: null }

    return {
      user: {
        email: data.email,
        sub: String(data.id),
      } satisfies UserInfo,
    }
  })
