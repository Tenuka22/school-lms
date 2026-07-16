import dotenv from "dotenv"
import { defineConfig } from "@hey-api/openapi-ts"

dotenv.config({ path: ".env.local" })

const { env } = await import("./src/lib/env")

export default defineConfig({
  input: `${env.PUBLIC_API_URL}/api/openapi.json`,
  output: "src/lib/api-client",
  plugins: [
    "@hey-api/typescript",
    "@hey-api/transformers",
    {
      name: "@hey-api/schemas",
      type: "json",
    },
    "@tanstack/react-query",
    "@hey-api/client-fetch",
    "valibot",
    {
      name: "@hey-api/sdk",
      validator: true,
    },
  ],
})
