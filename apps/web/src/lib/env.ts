import { object, string, safeParse } from "valibot"

const envSchema = object({
  NODE_ENV: string(),
  PUBLIC_API_URL: string(),
})

function loadEnv() {
  const result = safeParse(envSchema, process.env)
  if (!result.success) {
    console.error("Invalid environment variables:", result.issues)
    process.exit(1)
  }
  return result.output
}

export const env = loadEnv()
