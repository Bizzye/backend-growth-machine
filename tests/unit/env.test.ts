import { loadEnv } from "../../src/config/env.js";

const base = {
  MONGODB_URI: "mongodb://localhost:27017/test",
  JWT_SECRET: "a".repeat(32),
};

describe("loadEnv", () => {
  it("applies defaults", () => {
    expect(loadEnv(base)).toMatchObject({
      NODE_ENV: "development",
      PORT: 3333,
      JWT_EXPIRES_IN: "1d",
      CORS_ORIGIN: ["http://localhost:3000"],
      LOG_LEVEL: "info",
      TRUST_PROXY: 0,
    });
  });

  it("parses a comma separated list of CORS origins and coerces the port", () => {
    const env = loadEnv({ ...base, PORT: "8080", CORS_ORIGIN: "https://a.com, https://b.com" });

    expect(env.PORT).toBe(8080);
    expect(env.CORS_ORIGIN).toEqual(["https://a.com", "https://b.com"]);
  });

  it("fails fast with a readable message on weak or missing secrets", () => {
    expect(() => loadEnv({ MONGODB_URI: base.MONGODB_URI, JWT_SECRET: "short" })).toThrow(
      /JWT_SECRET must be at least 32 characters long/,
    );
    expect(() => loadEnv({ JWT_SECRET: base.JWT_SECRET })).toThrow(/MONGODB_URI/);
  });

  it("validates the token lifetime format", () => {
    expect(() => loadEnv({ ...base, JWT_EXPIRES_IN: "forever" })).toThrow(/JWT_EXPIRES_IN/);
  });
});
