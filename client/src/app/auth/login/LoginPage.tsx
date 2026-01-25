import React from "react";
("use client");

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/app/auth/store/auth-store";
import { cn } from "@/lib/utils";

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Theme colors from design tokens
const theme = {
  colors: {
    primary: "#1E4DB7",
    accent: "#0092D1",
    bgGradientStart: "#F6F9FF",
    bgGradientEnd: "#FFFFFF",
    textDark: "#0F172A",
    textLight: "#FFFFFF",
    borderGray: "#E5E7EB",
    muted: "#6B7280",
    success: "#10B981",
    error: "#EF4444",
  },
  radii: {
    md: "0.75rem", // 12px
    lg: "1.5rem", // 24px
  },
  shadows: {
    card: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    button:
      "0 4px 6px -1px rgba(30, 77, 183, 0.2), 0 2px 4px -1px rgba(30, 77, 183, 0.06)",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error: authError, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login({ email: data.email, password: data.password });
    } catch (error) {
      setFormError("root", {
        type: "manual",
        message: "Invalid email or password. Please try again.",
      });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.bgGradientStart} 0%, ${theme.colors.bgGradientEnd} 100%)`,
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-[#1E4DB7] rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AccuBooks</h1>
          <p className="text-gray-600">Enterprise Accounting Solution</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Sign In
          </h2>

          {authError && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {authError}
            </div>
          )}

          {errors.root?.message && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={cn(
                    "block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 placeholder-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-[#1E4DB7] focus:border-transparent",
                    "transition duration-150 ease-in-out",
                    errors.email ? "border-red-300" : "border-gray-300",
                  )}
                  aria-describedby={
                    errors.email ? "login-email-error" : undefined
                  }
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p id="login-email-error" className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-[#1E4DB7] hover:text-[#1A4298] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    "block w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 placeholder-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-[#1E4DB7] focus:border-transparent",
                    "transition duration-150 ease-in-out",
                    errors.password ? "border-red-300" : "border-gray-300",
                  )}
                  aria-describedby={
                    errors.password ? "login-password-error" : undefined
                  }
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide" : "Show"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="login-password-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Submit */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#1E4DB7] focus:ring-[#1E4DB7] border-gray-300 rounded"
                  {...register("rememberMe")}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full flex justify-center py-3 px-4 border border-transparent rounded-lg",
                  "text-sm font-medium text-white bg-[#1E4DB7] hover:bg-[#1A4298]",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E4DB7]",
                  "transition duration-150 ease-in-out",
                  "shadow-md hover:shadow-lg",
                  isLoading && "opacity-75 cursor-not-allowed",
                )}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  New to AccuBooks?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/auth/register"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E4DB7] transition duration-150 ease-in-out"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} AccuBooks Enterprise. All rights
            reserved.
          </p>
          <div className="mt-2">
            <Link
              href="/privacy"
              className="text-gray-500 hover:text-gray-700 mr-4"
            >
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
