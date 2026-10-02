import { rateLimit } from "express-rate-limit";

import { ERROR_CODES } from "../shared/errors/http-error.js";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/** Brute-force protection for the login endpoint (attempts per IP every 15 minutes). */
export function createLoginRateLimit(limit: number) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { code: ERROR_CODES.TOO_MANY_REQUESTS, message: "Too many login attempts, try again later" },
  });
}
