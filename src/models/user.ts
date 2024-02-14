import { compare, genSalt, hash } from 'bcryptjs';
import mongoose, { model } from 'mongoose';
import { IUser } from '../interfaces/user.interface';

const { Schema } = mongoose;

interface UsuarioModel extends Document, IUser {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema({
    email: {
      type: String,
      unique: true,
      required: true,
      match: /.+\@.+\..+/,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      match: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{4,}$/
    },
    lastName: String,
    firstName: {
      type: String,
      required: true
    },
    createdAt: { type: Date, default: Date.now },
    birthDate: Date,
});

userSchema.pre("save", async function (next) {
  if(!this.isModified("password")) {
    next();
  }

  const salt = await genSalt(10);
  this.password = await hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  console.log(this.password, password);
  try {
    return await compare(password, this.password);
  } catch (error) {
    console.log(error);
    return false;
  }
};


const User = model<UsuarioModel>('User', userSchema);

export default User;