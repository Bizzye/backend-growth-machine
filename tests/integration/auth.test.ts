import jwt from "jsonwebtoken";
import request from "supertest";

import { createApp } from "../../src/app.js";
import { buildUserInput, createTestApp, VALID_PASSWORD } from "../helpers/factories.js";

describe("POST /api/auth/login", () => {
  const app = createTestApp();

  async function registerUser() {
    const input = buildUserInput({ email: "Jane.Cooper@Example.com" });
    await request(app).post("/api/users").send(input).expect(201);
    return input;
  }

  it("returns a signed JWT and the public user data", async () => {
    await registerUser();

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "jane.cooper@example.com", password: VALID_PASSWORD })
      .expect(200);

    expect(response.body.user).toEqual({
      id: expect.any(String),
      email: "jane.cooper@example.com",
      firstName: "Jane",
      lastName: "Cooper",
    });
    expect(response.body.user).not.toHaveProperty("password");

    const payload = jwt.decode(response.body.token, { complete: true });
    expect(payload?.header.alg).toBe("HS256");
    expect(payload?.payload).toMatchObject({ sub: response.body.user.id });
  });

  it("normalizes the e-mail before looking the user up", async () => {
    await registerUser();

    await request(app)
      .post("/api/auth/login")
      .send({ email: "  JANE.COOPER@EXAMPLE.COM ", password: VALID_PASSWORD })
      .expect(200);
  });

  it.each([
    ["unknown e-mail", "ghost@example.com", VALID_PASSWORD],
    ["wrong password", "jane.cooper@example.com", "Wr0ng!Password"],
  ])("returns the same 401 error for %s (no user enumeration)", async (_case, email, password) => {
    await registerUser();

    const response = await request(app).post("/api/auth/login").send({ email, password }).expect(401);

    expect(response.body).toEqual({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
  });

  it("validates the payload", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: "not-an-email" }).expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.details.map((detail: { path: string }) => detail.path)).toEqual([
      "email",
      "password",
    ]);
  });

  it("rate limits repeated attempts", async () => {
    const limitedApp = createApp({ loginAttemptsLimit: 2 });
    const attempt = () =>
      request(limitedApp).post("/api/auth/login").send({ email: "a@b.com", password: "x" });

    await attempt().expect(401);
    await attempt().expect(401);
    const response = await attempt().expect(429);

    expect(response.body.code).toBe("TOO_MANY_REQUESTS");
  });
});
