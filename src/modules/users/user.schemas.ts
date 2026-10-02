import { isValidObjectId } from "mongoose";
import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Invalid e-mail"));

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(72, "Password must be at most 72 characters long") // bcrypt only uses the first 72 bytes
  .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
  .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
  .regex(/\d/, "Password must contain at least 1 number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character");

const nameSchema = (field: string) =>
  z.string().trim().min(3, `${field} must be at least 3 characters long`).max(50);

const birthDateSchema = z.coerce
  .date()
  // Evaluated per request (a static `.max(new Date())` would freeze the date at startup).
  .refine((date) => date <= new Date(), "Birth date cannot be in the future")
  .nullish()
  .or(z.literal("").transform(() => null));

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema("First name"),
  lastName: nameSchema("Last name"),
  birthDate: birthDateSchema,
});

export const updateUserSchema = createUserSchema
  .pick({ firstName: true, lastName: true, birthDate: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

export const userIdParamsSchema = z.object({
  id: z.string().refine(isValidObjectId, "Invalid user id"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
