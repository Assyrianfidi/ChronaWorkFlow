import { Request } from 'express';

export interface UserPayload {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  isActive: boolean;
  tenantId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export interface AuthRequest<T = any, P = any, Q = any> extends Request<P, any, T, Q> {
  user: UserPayload;
  tenantId?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateDetailsInput {
  name?: string;
  email?: string;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}
