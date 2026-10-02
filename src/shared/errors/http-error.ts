export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ErrorDetail {
  path: string;
  message: string;
}

/** Error that maps directly to an HTTP response: `{ code, message, details? }`. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = "HttpError";
  }

  toJSON() {
    return { code: this.code, message: this.message, ...(this.details && { details: this.details }) };
  }

  static badRequest(message: string, details?: ErrorDetail[]) {
    return new HttpError(400, ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  static unauthorized(message = "Authentication required", code: ErrorCode = ERROR_CODES.UNAUTHORIZED) {
    return new HttpError(401, code, message);
  }

  static forbidden(message = "You are not allowed to perform this action") {
    return new HttpError(403, ERROR_CODES.FORBIDDEN, message);
  }

  static notFound(message = "Resource not found", code: ErrorCode = ERROR_CODES.NOT_FOUND) {
    return new HttpError(404, code, message);
  }

  static conflict(message: string, code: ErrorCode) {
    return new HttpError(409, code, message);
  }
}
