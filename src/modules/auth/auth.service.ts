import { ERROR_CODES, HttpError } from "../../shared/errors/http-error.js";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "../../shared/security/password.js";
import { signAccessToken } from "../../shared/security/token.js";
import { userRepository, type UserRepository } from "../users/user.repository.js";
import type { LoginInput } from "./auth.schemas.js";

export interface LoginResult {
  token: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

export function createAuthService(repository: UserRepository = userRepository) {
  return {
    async login({ email, password }: LoginInput): Promise<LoginResult> {
      const user = await repository.findByEmailWithPassword(email);

      // Always run bcrypt (even for unknown e-mails) and return the same error for both cases,
      // so neither the message nor the response time reveals whether the e-mail is registered.
      const passwordMatches = await verifyPassword(password, user?.password ?? DUMMY_PASSWORD_HASH);

      if (!user || !passwordMatches) {
        throw HttpError.unauthorized("Invalid credentials", ERROR_CODES.INVALID_CREDENTIALS);
      }

      const id = user._id.toString();

      return {
        token: signAccessToken(id),
        user: { id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      };
    },
  };
}

export const authService = createAuthService();
