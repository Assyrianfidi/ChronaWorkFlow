import React from "react";

export type Session = {
  user?: any;
  expires?: string;
};

export type UseSessionResult = {
  data: Session | null;
  status: "authenticated" | "unauthenticated" | "loading";
};

export function useSession(): UseSessionResult {
  return { data: null, status: "unauthenticated" };
}

export async function getSession(): Promise<Session | null> {
  return null;
}

export async function signIn(): Promise<void> {
  return;
}

export async function signOut(): Promise<void> {
  return;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}
