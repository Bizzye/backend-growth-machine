import type { RequestHandler } from "express";
import type { z } from "zod";

interface RequestSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
}

/**
 * Validates and sanitizes the request with Zod. Parsed values replace the raw ones, so
 * controllers only ever see trusted, normalized data (unknown fields are stripped).
 * Validation errors are turned into 400 responses by the error handler.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    next();
  };
}
