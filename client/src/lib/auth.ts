// Vite client shim: next-auth is not available in this bundle.
// This module exists only to satisfy imports during client builds.

export type NextAuthConfig = any;

// Auth configuration (server-only in real deployments)
export const authConfig: NextAuthConfig = {};

// Named exports expected by callers
export const handlers: any = {};
export const auth: any = async () => null;
export const signIn: any = async () => undefined;
export const signOut: any = async () => undefined;

// Default export placeholder
export default {};
