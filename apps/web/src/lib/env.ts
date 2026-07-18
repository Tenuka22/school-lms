import { createEnv } from "@t3-oss/env-core"
import { string } from "valibot"

const runtimeEnv = typeof process !== "undefined" && process.env
  ? { ...process.env, ...import.meta.env }
  : { ...import.meta.env }

export const env = createEnv({
  server: {
    NODE_ENV: string(),
  },
  clientPrefix: "VITE_",
  client: {
    VITE_PUBLIC_API_URL: string(),
    VITE_LOG_LEVEL: string(),
  },
  runtimeEnv,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})
