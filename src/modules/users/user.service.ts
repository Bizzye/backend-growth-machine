import { ERROR_CODES, HttpError } from "../../shared/errors/http-error.js";
import { hashPassword } from "../../shared/security/password.js";
import { toUserResponse, type UserResponse } from "./user.mapper.js";
import { userRepository, type UserRepository } from "./user.repository.js";
import type { CreateUserInput, UpdateUserInput } from "./user.schemas.js";

/** Business rules for users. The repository is injected to keep the service testable. */
export function createUserService(repository: UserRepository = userRepository) {
  return {
    async create({ password, ...data }: CreateUserInput): Promise<UserResponse> {
      if (await repository.existsByEmail(data.email)) {
        throw HttpError.conflict("User already exists", ERROR_CODES.USER_ALREADY_EXISTS);
      }

      const user = await repository.create({ ...data, passwordHash: await hashPassword(password) });
      return toUserResponse(user);
    },

    async list(): Promise<UserResponse[]> {
      const users = await repository.findAll();
      return users.map(toUserResponse);
    },

    async getById(id: string): Promise<UserResponse> {
      const user = await repository.findById(id);
      if (!user) throw HttpError.notFound("User not found", ERROR_CODES.USER_NOT_FOUND);
      return toUserResponse(user);
    },

    async update(requesterId: string, id: string, data: UpdateUserInput): Promise<UserResponse> {
      if (requesterId !== id) {
        throw HttpError.forbidden("You can only update your own profile");
      }

      const user = await repository.update(id, data);
      if (!user) throw HttpError.notFound("User not found", ERROR_CODES.USER_NOT_FOUND);
      return toUserResponse(user);
    },
  };
}

export const userService = createUserService();
