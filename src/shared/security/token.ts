import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../../config/env.js";

const ALGORITHM = "HS256";

export interface TokenPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
}

/** Throws if the token is malformed, expired or signed with another secret/algorithm. */
export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });

  if (typeof payload === "string" || !payload.sub) {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }

  return { sub: payload.sub };
}
