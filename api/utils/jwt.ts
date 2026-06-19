import jwt from 'jsonwebtoken';
import type { User } from '../../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aesthetic-clinic-jwt-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: number;
  username: string;
  role: string;
}

export const generateToken = (user: Omit<User, 'passwordHash'>): string => {
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};
