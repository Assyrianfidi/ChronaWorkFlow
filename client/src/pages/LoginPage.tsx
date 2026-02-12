import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import Logo from "../assets/chronaworkflow-logo.png";
import { designSystem, cn } from "../styles/designSystem";

/**
 * LoginPage - CEO-Level SaaS Authentication
 * 
 * Clean, modern, accessible login page following ChronaWorkFlow design system.
 * No demo features, high contrast, WCAG compliant.
 */
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("accubooks_remember");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem("accubooks_remember", email);
      } else {
        localStorage.removeItem("accubooks_remember");
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={designSystem.components.container.centered}>
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src={Logo}
              alt="ChronaWorkFlow Logo"
              className="h-20 w-auto transition-transform duration-300 hover:scale-105"
            />
          </div>
          <h1 className={cn(designSystem.typography.h2, "mb-2")}>
            Welcome to AccuBooks
          </h1>
          <p className={designSystem.typography.small}>
            Sign in to manage your business finances
          </p>
        </div>

        {/* Login Card */}
        <div className={designSystem.components.card.base}>
          <div className={designSystem.spacing.cardPadding}>
            <form onSubmit={handleSubmit} className={designSystem.spacing.formSpacing}>
              {/* Error Alert */}
              {error && (
                <div className={designSystem.components.alert.error} role="alert">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Email Field */}
              <div className={designSystem.spacing.tightSpacing}>
                <label
                  htmlFor="email"
                  className={designSystem.typography.label}
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      designSystem.components.input.base,
                      "pl-10",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className={designSystem.spacing.tightSpacing}>
                <label
                  htmlFor="password"
                  className={designSystem.typography.label}
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      designSystem.components.input.base,
                      "pl-10 pr-10",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className={designSystem.components.link.primary}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  designSystem.components.button.primary,
                  "w-full",
                  isLoading && designSystem.components.button.disabled
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Register Link */}
              <div className="text-center">
                <p className={designSystem.typography.small}>
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className={designSystem.components.link.primary}
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <Link
              to="/privacy"
              className={designSystem.components.link.secondary}
            >
              Privacy Policy
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              to="/terms"
              className={designSystem.components.link.secondary}
            >
              Terms of Service
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            © {new Date().getFullYear()} AccuBooks. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
