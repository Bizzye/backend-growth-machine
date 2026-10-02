import { z } from "zod";

import { emailSchema } from "../users/user.schemas.js";

export const loginSchema = z.object({
  email: emailSchema,
  // No strength rules here: they belong to sign up, and must not leak through login errors.
  password: z.string().min(1, "Password is required").max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
