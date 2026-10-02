import bcrypt from "bcryptjs";

import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  SALT_ROUNDS,
  verifyPassword,
} from "../../src/shared/security/password.js";

describe("password hashing", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("Str0ng!Pass");

    expect(await verifyPassword("Str0ng!Pass", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("uses the same cost for the dummy hash, so timing matches real users", () => {
    expect(bcrypt.getRounds(DUMMY_PASSWORD_HASH)).toBe(SALT_ROUNDS);
  });
});
