import request from "supertest";

import { createTestApp } from "../helpers/factories.js";

const app = createTestApp();

describe("application", () => {
  it("exposes a health check", async () => {
    const response = await request(app).get("/api/health").expect(200);
    expect(response.body).toEqual({ status: "ok", database: true });
  });

  it("sends security headers and hides the framework", async () => {
    const response = await request(app).get("/api/health");

    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["content-security-policy"]).toBeDefined();
  });

  it("allows CORS only for the configured origin", async () => {
    const allowed = await request(app).get("/api/health").set("Origin", "http://localhost:3000");
    const blocked = await request(app).get("/api/health").set("Origin", "https://evil.example.com");

    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("returns a JSON 404 for unknown routes", async () => {
    const response = await request(app).get("/api/unknown").expect(404);
    expect(response.body).toEqual({ code: "NOT_FOUND", message: "Route GET /api/unknown not found" });
  });

  it("rejects malformed JSON bodies", async () => {
    const response = await request(app)
      .post("/api/users")
      .set("Content-Type", "application/json")
      .send("{ invalid")
      .expect(400);

    expect(response.body.message).toBe("Malformed JSON body");
  });

  it("rejects payloads larger than 10kb", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ firstName: "x".repeat(20_000) })
      .expect(413);

    expect(response.body.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("serves the API documentation", async () => {
    await request(app).get("/docs/").expect(200).expect("Content-Type", /html/);
  });
});
