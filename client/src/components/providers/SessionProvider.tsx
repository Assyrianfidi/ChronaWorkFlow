"use client";

import React from "react";
import { ReactNode } from "react";

interface SessionProviderProps {
  children: ReactNode;
  session?: any; // You can import and use the proper Session type from 'next-auth' if needed
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return <>{children}</>;
}
