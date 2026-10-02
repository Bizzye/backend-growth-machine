import { type UserDocument, UserModel } from "./user.model.js";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  birthDate?: Date | null;
}

export type UpdateUserData = Partial<Pick<CreateUserData, "firstName" | "lastName" | "birthDate">>;

/** Data-access layer: the only place that talks to Mongoose. */
export const userRepository = {
  findAll(): Promise<UserDocument[]> {
    return UserModel.find().sort({ createdAt: -1 }).lean<UserDocument[]>();
  },

  findById(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id).lean<UserDocument>();
  },

  findByEmailWithPassword(email: string): Promise<(UserDocument & { password: string }) | null> {
    return UserModel.findOne({ email }).select("+password").lean<UserDocument & { password: string }>();
  },

  async existsByEmail(email: string): Promise<boolean> {
    return (await UserModel.exists({ email })) !== null;
  },

  async create({ passwordHash, ...data }: CreateUserData): Promise<UserDocument> {
    const user = await UserModel.create({ ...data, password: passwordHash });
    return user.toObject<UserDocument>();
  },

  update(id: string, data: UpdateUserData): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    }).lean<UserDocument>();
  },
};

export type UserRepository = typeof userRepository;
