"use client";

import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.js';
import { AlertCircle } from "lucide-react";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The token has expired or has already been used.",
    Default: "An error occurred during sign in.",
  };

  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <a
            href="/auth/signin"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Return to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
