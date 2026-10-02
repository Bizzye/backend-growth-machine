import type { RequestHandler } from "express";

import { HttpError } from "../shared/errors/http-error.js";
import { verifyAccessToken } from "../shared/security/token.js";

const BEARER_PREFIX = "Bearer ";

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith(BEARER_PREFIX)) {
    throw HttpError.unauthorized();
  }

  try {
    const { sub } = verifyAccessToken(header.slice(BEARER_PREFIX.length));
    req.user = { id: sub };
  } catch {
    throw HttpError.unauthorized("Invalid or expired token");
  }

  next();
};
