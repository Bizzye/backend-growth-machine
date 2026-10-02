import mongoose from "mongoose";
import { z } from "zod";

import { toHttpError } from "../../src/middlewares/error-handler.js";
import { HttpError } from "../../src/shared/errors/http-error.js";

describe("toHttpError", () => {
  it("keeps HttpError instances", () => {
    const error = HttpError.forbidden();
    expect(toHttpError(error)).toBe(error);
  });

  it("maps Zod errors to 400 with field details", () => {
    const result = z.object({ email: z.email() }).safeParse({ email: "x" });

    const error = toHttpError(result.error);

    expect(error.status).toBe(400);
    expect(error.toJSON()).toMatchObject({
      code: "VALIDATION_ERROR",
      details: [{ path: "email", message: expect.any(String) }],
    });
  });

  it("maps Mongo duplicate key errors to 409", () => {
    const error = toHttpError(Object.assign(new Error("E11000"), { code: 11000 }));
    expect(error).toMatchObject({ status: 409, code: "USER_ALREADY_EXISTS" });
  });

  it("maps Mongoose cast errors to 400", () => {
    const castError = new mongoose.Error.CastError("ObjectId", "abc", "_id");
    expect(toHttpError(castError)).toMatchObject({ status: 400, message: 'Invalid value for "_id"' });
  });

  it("hides unexpected errors behind a generic 500", () => {
    const error = toHttpError(new Error("connection string with password leaked"));

    expect(error.status).toBe(500);
    expect(error.toJSON()).toEqual({ code: "INTERNAL_ERROR", message: "Internal server error" });
  });
});
