import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

import { ERROR_CODES, HttpError } from "../shared/errors/http-error.js";
import { logger } from "../shared/logger.js";

const MONGO_DUPLICATE_KEY = 11000;

/** Errors raised by `express.json()` (body-parser) carry a `type` such as "entity.too.large". */
function getBodyParserErrorType(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "type" in error && typeof error.type === "string") {
    return error.type;
  }
  return undefined;
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === MONGO_DUPLICATE_KEY;
}

/** Normalizes any thrown value into an `HttpError`. */
export function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;

  if (error instanceof ZodError) {
    return HttpError.badRequest(
      "Invalid request data",
      error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    );
  }

  const bodyParserError = getBodyParserErrorType(error);
  if (bodyParserError === "entity.parse.failed") {
    return HttpError.badRequest("Malformed JSON body");
  }
  if (bodyParserError === "entity.too.large") {
    return new HttpError(413, ERROR_CODES.PAYLOAD_TOO_LARGE, "Request body is too large");
  }

  if (error instanceof mongoose.Error.CastError) {
    return HttpError.badRequest(`Invalid value for "${error.path}"`);
  }

  if (isDuplicateKeyError(error)) {
    return HttpError.conflict("User already exists", ERROR_CODES.USER_ALREADY_EXISTS);
  }

  return new HttpError(500, ERROR_CODES.INTERNAL_ERROR, "Internal server error");
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const httpError = toHttpError(error);

  if (httpError.status >= 500) {
    // Full details go to the logs only; the client gets a generic message.
    logger.error({ err: error, method: req.method, url: req.originalUrl }, "Unhandled error");
  }

  res.status(httpError.status).json(httpError);
};

export const notFoundHandler: RequestHandler = (req) => {
  throw HttpError.notFound(`Route ${req.method} ${req.path} not found`);
};
