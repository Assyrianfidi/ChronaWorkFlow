import { User, Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: Role;
        isActive: boolean;
      };
      token?: string;
      refreshToken?: string;
    }
  }
}

export {};
