import { createServerFn } from "@tanstack/react-start"
import { setCookie, deleteCookie, getCookie } from "@tanstack/react-start/server"
import { login as apiLogin, register as apiRegister, logout as apiLogout, me } from "@/lib/api-client"
import { serverClient } from "@/lib/server/api-client"

export interface UserInfo {
  email: string
  sub: string
}

export const loginAction = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => d)
  .handler(async (ctx) => {
    const { data } = await apiLogin({
      client: serverClient,
      body: { email: ctx.data.email, password: ctx.data.password },
    })
    if (!data) throw new Error("Login failed")

    const expiresAt = Number(data.expires_at)
    setCookie("access_token", data.access_token, {
      expires: new Date(expiresAt * 1000),
      path: "/",
      sameSite: "lax",
    })
    setCookie("refresh_token", data.refresh_token, {
      expires: new Date((expiresAt + 60 * 60 * 24 * 30) * 1000),
      path: "/",
      sameSite: "lax",
    })
    setCookie("access_token_expires_at", String(expiresAt), {
      expires: new Date((expiresAt + 60 * 60 * 24 * 30) * 1000),
      path: "/",
      sameSite: "lax",
    })

    return { ok: true as const }
  })

export const registerAction = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string })=>d)
  .handler(async (ctx) => {
    const { data } = await apiRegister({
      client: serverClient,
      body: { email: ctx.data.email, password: ctx.data.password },
    })
    if (!data) throw new Error("Registration failed")

    const expiresAt = Number(data.expires_at)
    setCookie("access_token", data.access_token, {
      expires: new Date(expiresAt * 1000),
      path: "/",
      sameSite: "lax",
    })
    setCookie("refresh_token", data.refresh_token, {
      expires: new Date((expiresAt + 60 * 60 * 24 * 30) * 1000),
      path: "/",
      sameSite: "lax",
    })
    setCookie("access_token_expires_at", String(expiresAt), {
      expires: new Date((expiresAt + 60 * 60 * 24 * 30) * 1000),
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
          client: serverClient,
          body: { refresh_token: refreshToken },
        })
      } catch {
        // ignore logout API errors
      }
    }

    deleteCookie("access_token", { path: "/" })
    deleteCookie("refresh_token", { path: "/" })
    deleteCookie("access_token_expires_at", { path: "/" })

    return { ok: true as const }
  })

export const getMeAction = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data } = await me({ client: serverClient })
    if (!data) return { user: null }

    return {
      user: {
        email: data.email,
        sub: String(data.id),
      } satisfies UserInfo,
    }
  })
