export type UserRole = "USER" | "ADMIN";

export interface Account {
  id: string;
  provider: string;
  providerAccountId: string;
  type: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  role: UserRole;
  accounts: Account[];
  createdAt: Date;
  updatedAt: Date;
}

// Type guards
export const isAdmin = (user: User | null | undefined): boolean => {
  return user?.role === "ADMIN";
};

// Type predicates
export function isUser(user: any): user is User {
  return (
    user &&
    typeof user === "object" &&
    "id" in user &&
    "email" in user &&
    "role" in user
  );
}
