import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Pre-computed hash used when the user does not exist, so login takes the same time
 * either way and response timing does not reveal which e-mails are registered.
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync("dummy-password-for-timing-safety", SALT_ROUNDS);
