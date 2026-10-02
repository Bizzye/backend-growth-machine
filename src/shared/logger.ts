import { pino } from "pino";

import { env } from "../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.LOG_LEVEL,
  // Never log credentials or tokens.
  redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token"],
  ...(env.NODE_ENV === "development" && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
});
