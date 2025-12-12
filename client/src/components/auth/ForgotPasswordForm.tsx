import React from 'react';
import { useState } from "react";
// @ts-ignore
import { useAuthStore } from '../store/auth-store.js.js';
// @ts-ignore
import { Button } from '../components/ui/button.js.js';
// @ts-ignore
import { Input } from '../components/ui/input.js.js';
// @ts-ignore
import { Label } from '../components/ui/label.js.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js.js';
// @ts-ignore
import { Icons } from '../components/icons.js.js';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { requestPasswordReset } = useAuthStore();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setMessage(
        "If an account with that email exists, we have sent a password reset link. Please check your email.",
      );
      setEmail("");
    } catch (submissionError) {
// @ts-ignore
      const err = submissionError as Error;
      setError(err.message || "Failed to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Forgot your password?
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we’ll send you a link to reset your
            password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {message ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {message}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete="email"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  variant="default"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <div className="text-center text-sm">
              <a
                href="/auth/login"
                className="font-medium text-blue-600 hover:underline"
              >
                Back to sign in
              </a>
            </div>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <a
                href="/auth/register"
                className="font-medium text-blue-600 hover:underline"
              >
                Sign up
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default ForgotPasswordForm;
