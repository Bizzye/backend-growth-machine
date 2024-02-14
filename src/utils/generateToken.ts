import { sign } from 'jsonwebtoken';
import { configs } from '../enums/config.enum';

const generateToken = (id: string) => {
  return sign({ id }, configs.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export { generateToken };

