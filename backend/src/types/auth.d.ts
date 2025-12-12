import { User, Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: string;
      refreshToken?: string;
    }
  }
}

export interface AuthUser
  extends Pick<User, "id" | "email" | "role" | "isActive"> {
  role: Role;
}

export interface TokenPayload {
  userId: number;
  type: "access" | "refresh";
  role: string;
  iat: number;
  exp: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
