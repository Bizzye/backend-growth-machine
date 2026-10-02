import request from "supertest";

import { UserModel } from "../../src/modules/users/user.model.js";
import { signAccessToken } from "../../src/shared/security/token.js";
import { buildUserInput, createAuthenticatedUser, createTestApp } from "../helpers/factories.js";

const app = createTestApp();

describe("POST /api/users", () => {
  it("creates a user and never returns the password", async () => {
    const input = buildUserInput({ email: "Robert.Fox@Example.com" });

    const response = await request(app).post("/api/users").send(input).expect(201);

    expect(response.headers.location).toBe(`/api/users/${response.body.id}`);
    expect(response.body).toEqual({
      id: expect.any(String),
      email: "robert.fox@example.com",
      firstName: "Jane",
      lastName: "Cooper",
      birthDate: "1994-03-12T00:00:00.000Z",
      createdAt: expect.any(String),
    });
  });

  it("stores a bcrypt hash instead of the plain password", async () => {
    const input = buildUserInput();
    await request(app).post("/api/users").send(input).expect(201);

    const stored = await UserModel.findOne({ email: input.email }).select("+password").lean();

    expect(stored?.password).not.toBe(input.password);
    expect(stored?.password).toMatch(/^\$2[aby]\$12\$/);
  });

  it("accepts users without birth date", async () => {
    const response = await request(app)
      .post("/api/users")
      .send(buildUserInput({ birthDate: "" }))
      .expect(201);

    expect(response.body.birthDate).toBeNull();
  });

  it("returns 409 for a duplicated e-mail (case-insensitive)", async () => {
    await request(app)
      .post("/api/users")
      .send(buildUserInput({ email: "dup@example.com" }))
      .expect(201);

    const response = await request(app)
      .post("/api/users")
      .send(buildUserInput({ email: "DUP@example.com" }))
      .expect(409);

    expect(response.body).toEqual({ code: "USER_ALREADY_EXISTS", message: "User already exists" });
  });

  it.each([
    ["weak password", { password: "weak" }, "password"],
    ["short first name", { firstName: "Jo" }, "firstName"],
    ["invalid e-mail", { email: "nope" }, "email"],
    ["future birth date", { birthDate: "2999-01-01" }, "birthDate"],
  ])("rejects %s", async (_case, overrides, path) => {
    const response = await request(app).post("/api/users").send(buildUserInput(overrides)).expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.details[0].path).toBe(path);
  });

  it("strips unknown fields (mass assignment protection)", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ ...buildUserInput(), role: "admin", createdAt: "2000-01-01" })
      .expect(201);

    expect(response.body).not.toHaveProperty("role");
    expect(response.body.createdAt).not.toBe("2000-01-01T00:00:00.000Z");
  });
});

describe("GET /api/users", () => {
  it("requires authentication", async () => {
    const response = await request(app).get("/api/users").expect(401);
    expect(response.body.code).toBe("UNAUTHORIZED");
  });

  it.each([
    ["malformed token", "Bearer not-a-jwt"],
    ["wrong scheme", "Basic abc"],
  ])("rejects a %s", async (_case, authorization) => {
    await request(app).get("/api/users").set("Authorization", authorization).expect(401);
  });

  it("lists users, newest first, without passwords", async () => {
    await createAuthenticatedUser(app, { firstName: "First" });
    const { token } = await createAuthenticatedUser(app, { firstName: "Second" });

    const response = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`).expect(200);

    expect(response.body.map((user: { firstName: string }) => user.firstName)).toEqual(["Second", "First"]);
    expect(JSON.stringify(response.body)).not.toContain("password");
  });
});

describe("GET /api/users/me", () => {
  it("returns the authenticated user", async () => {
    const { user, token } = await createAuthenticatedUser(app);

    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual(user);
  });

  it("returns 404 when the user no longer exists", async () => {
    const token = signAccessToken("65d1f0a2c3b4a5e6f7a8b999");

    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(response.body.code).toBe("USER_NOT_FOUND");
  });
});

describe("PATCH /api/users/:id", () => {
  it("updates the authenticated user's own profile", async () => {
    const { user, token } = await createAuthenticatedUser(app);

    const response = await request(app)
      .patch(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Janet", email: "hacker@example.com" })
      .expect(200);

    expect(response.body.firstName).toBe("Janet");
    expect(response.body.email).toBe(user.email);
  });

  it("does not re-hash the password on update (user can still log in)", async () => {
    const { user, token, input } = await createAuthenticatedUser(app);

    await request(app)
      .patch(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ lastName: "Updated" })
      .expect(200);

    await request(app)
      .post("/api/auth/login")
      .send({ email: input.email, password: input.password })
      .expect(200);
  });

  it("forbids updating another user", async () => {
    const { user: victim } = await createAuthenticatedUser(app);
    const { token } = await createAuthenticatedUser(app);

    const response = await request(app)
      .patch(`/api/users/${victim.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Hacked" })
      .expect(403);

    expect(response.body.code).toBe("FORBIDDEN");
  });

  it("validates the id and the payload", async () => {
    const { user, token } = await createAuthenticatedUser(app);
    const auth = { Authorization: `Bearer ${token}` };

    await request(app).patch("/api/users/not-an-id").set(auth).send({ firstName: "Janet" }).expect(400);
    await request(app).patch(`/api/users/${user.id}`).set(auth).send({}).expect(400);
  });

  it("returns 404 when the user was deleted", async () => {
    const { user, token } = await createAuthenticatedUser(app);
    await UserModel.deleteOne({ _id: user.id });

    await request(app)
      .patch(`/api/users/${user.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Janet" })
      .expect(404);
  });
});
