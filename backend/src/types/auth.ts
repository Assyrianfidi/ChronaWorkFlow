export interface AuthUser {
  id: number;
  role: "admin" | "manager" | "assistant_manager" | "user";
}

export interface TokenPayload {
  id: number;
  role: "admin" | "manager" | "assistant_manager" | "user";
  iat?: number;
  exp?: number;
}
