import * as React from "react";

type TokenBoxProps = {
  children: React.ReactNode;
};

export function TokenBox({ children }: TokenBoxProps) {
  return <div className="rounded-lg border border-border p-4">{children}</div>;
}
