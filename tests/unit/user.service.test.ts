import { createUserService } from "../../src/modules/users/user.service.js";
import type { UserRepository } from "../../src/modules/users/user.repository.js";

/** Service tested in isolation with a fake repository (dependency injection). */
function createFakeRepository(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByEmailWithPassword: vi.fn().mockResolvedValue(null),
    existsByEmail: vi.fn().mockResolvedValue(false),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

const now = new Date("2024-02-18T14:32:00.000Z");
const storedUser = {
  _id: { toString: () => "user-1" },
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Cooper",
  birthDate: null,
  password: "hash",
  createdAt: now,
  updatedAt: now,
};

describe("userService", () => {
  it("hashes the password before persisting", async () => {
    const repository = createFakeRepository({ create: vi.fn().mockResolvedValue(storedUser) });
    const service = createUserService(repository);

    const user = await service.create({
      email: "jane@example.com",
      password: "Str0ng!Pass",
      firstName: "Jane",
      lastName: "Cooper",
      birthDate: null,
    });

    const [data] = vi.mocked(repository.create).mock.calls[0]!;
    expect(data).not.toHaveProperty("password");
    expect(data.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(user).toEqual({
      id: "user-1",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Cooper",
      birthDate: null,
      createdAt: now.toISOString(),
    });
  });

  it("rejects duplicated e-mails before hashing", async () => {
    const repository = createFakeRepository({ existsByEmail: vi.fn().mockResolvedValue(true) });

    await expect(
      createUserService(repository).create({
        email: "jane@example.com",
        password: "Str0ng!Pass",
        firstName: "Jane",
        lastName: "Cooper",
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("checks ownership before touching the database on update", async () => {
    const repository = createFakeRepository();

    await expect(
      createUserService(repository).update("user-1", "user-2", { firstName: "X" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(repository.update).not.toHaveBeenCalled();
  });
});
