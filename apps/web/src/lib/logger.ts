import pino from "pino"
import { env } from "./env"

const logger = pino({
  level: env.VITE_LOG_LEVEL,
  browser: { asObject: true },
  transport:
    env.VITE_LOG_LEVEL === "debug" && typeof window === "undefined"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
})

export default logger
