import { DefaultSession, DefaultUser } from "next-auth";

export type UserRole = "USER" | "ADMIN";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  /**
   * Extend the built-in user types
   */
  interface User extends DefaultUser {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extend the built-in JWT types
   */
  interface JWT {
    id: string;
    role: UserRole;
  }
}
