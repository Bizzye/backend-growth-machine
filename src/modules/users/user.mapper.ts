import type { UserDocument } from "./user.model.js";

/** Public representation of a user. Never includes the password hash. */
export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  createdAt: string;
}

export function toUserResponse(user: UserDocument): UserResponse {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
  };
}
