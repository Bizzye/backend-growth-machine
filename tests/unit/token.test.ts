import jwt from "jsonwebtoken";

import { signAccessToken, verifyAccessToken } from "../../src/shared/security/token.js";

const SECRET = process.env.JWT_SECRET!;

describe("access tokens", () => {
  it("round-trips the user id as the subject", () => {
    expect(verifyAccessToken(signAccessToken("user-123"))).toEqual({ sub: "user-123" });
  });

  it("rejects tokens signed with another secret", () => {
    const forged = jwt.sign({ sub: "user-123" }, "another-secret-that-is-long-enough!!");
    expect(() => verifyAccessToken(forged)).toThrow();
  });

  it("rejects the `none` algorithm", () => {
    const unsigned = jwt.sign({ sub: "user-123" }, "", { algorithm: "none" });
    expect(() => verifyAccessToken(unsigned)).toThrow();
  });

  it("rejects expired tokens", () => {
    const expired = jwt.sign({ sub: "user-123" }, SECRET, { expiresIn: -10 });
    expect(() => verifyAccessToken(expired)).toThrow(jwt.TokenExpiredError);
  });

  it("rejects tokens without subject", () => {
    const token = jwt.sign({ foo: "bar" }, SECRET);
    expect(() => verifyAccessToken(token)).toThrow("Invalid token payload");
  });
});
