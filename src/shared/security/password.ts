import bcrypt from "bcryptjs";

export const SALT_ROUNDS = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hash compared against when the user does not exist, so login takes the same time either way and
 * response timing does not reveal which e-mails are registered. It is a hard-coded cost-12 hash of
 * a random value (computing it at import time would block the event loop for ~300ms).
 */
export const DUMMY_PASSWORD_HASH = "$2b$12$CWynjIFKqB5Uxobw0CaRUeK9KbM6A88e54zht0rD85i7.AAkVRYKS";
