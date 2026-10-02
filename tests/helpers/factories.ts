import request from "supertest";
import type { z } from "zod";

import { createApp } from "../../src/app.js";
import type { createUserSchema } from "../../src/modules/users/user.schemas.js";

/** Raw request body (before Zod parsing), e.g. dates as strings. */
type CreateUserBody = z.input<typeof createUserSchema>;

export const VALID_PASSWORD = "Str0ng!Pass";

let sequence = 0;

export function buildUserInput(overrides: Partial<CreateUserBody> = {}) {
  sequence++;
  return {
    email: `user${sequence}@example.com`,
    password: VALID_PASSWORD,
    firstName: "Jane",
    lastName: "Cooper",
    birthDate: "1994-03-12T00:00:00.000Z",
    ...overrides,
  };
}

/** App with a high login limit so tests are not throttled. */
export const createTestApp = () => createApp({ loginAttemptsLimit: 1_000 });

/** Registers a user through the API and returns it with a valid access token. */
export async function createAuthenticatedUser(
  app: ReturnType<typeof createApp>,
  overrides: Partial<CreateUserBody> = {},
) {
  const input = buildUserInput(overrides);
  const { body: user } = await request(app).post("/api/users").send(input).expect(201);
  const { body } = await request(app)
    .post("/api/auth/login")
    .send({ email: input.email, password: input.password })
    .expect(200);

  return { user, token: body.token as string, input };
}
