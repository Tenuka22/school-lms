import { createEnv } from "@t3-oss/env-core";
import { string } from "valibot";
import "dotenv/config";

export const env = createEnv({
  server: {
    NODE_ENV: string(),
  },
  clientPrefix: "VITE_",
  client: {
    VITE_PUBLIC_API_URL: string(),
  },
  runtimeEnv: process.env || import.meta.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
