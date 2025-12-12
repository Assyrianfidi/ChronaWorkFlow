import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
// @ts-ignore
import { useAuthStore } from '../../store/auth-store.js.js';
// @ts-ignore
import { Button } from '../../components/ui/button.js.js';
// @ts-ignore
import { Input } from '../../components/ui/input.js.js';
// @ts-ignore
import { InputWithIcon } from '../../components/ui/input-with-icon.js.js';
// @ts-ignore
import { Label } from '../../components/ui/label.js.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.js.js';
// @ts-ignore
import { Alert, AlertDescription } from '../../components/ui/alert.js.js';
import { Mail, Lock, Eye, EyeOff, Building2 } from "lucide-react";
// @ts-ignore
import Logo from '../../assets/AccubooksEnterprise_Logo16_.jpg.js.js';

const tokens = require("../../design-system/tokens.json");

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [variant, setVariant] = useState<"A" | "B" | "C">("A");

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  // Load variant from localStorage and save changes
  useEffect(() => {
    const savedVariant =
// @ts-ignore
      (localStorage.getItem("accubooks:login-variant") as "A" | "B" | "C") ||
      "A";
    setVariant(savedVariant);
  }, []);

  useEffect(() => {
    localStorage.setItem("accubooks:login-variant", variant);
  }, [variant]);

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
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Variant-specific styles
  const getVariantClasses = () => {
    switch (variant) {
      case "A": // Glass-Morph
        return {
          main: "min-h-screen soft-professional-gradient flex items-center justify-center p-4",
          container:
            "max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center",
          heroSection:
            "hidden lg:flex flex-col items-center justify-center p-8",
          cardSection: "variant-glass rounded-xl p-8 shadow-elevated",
          card: "bg-transparent border-0 shadow-none p-0",
          input:
            "bg-white/70 border-white/20 text-text-dark placeholder:text-muted focus:ring-2 focus:ring-accent",
          button:
            "bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300",
          link: "text-accent hover:text-accent/80 font-medium",
          text: "text-text-dark",
          mutedText: "text-muted",
        };
      case "B": // Minimal Professional
        return {
          main: "min-h-screen bg-gray-50 flex items-center justify-center p-4",
          container: "max-w-md w-full",
          heroSection: "hidden",
          cardSection: "variant-minimal rounded-xl p-8",
          card: "bg-transparent border-0 shadow-none p-0",
          input:
            "bg-white border-gray-200 text-text-dark placeholder:text-muted focus:ring-2 focus:ring-accent",
          button:
            "bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-300",
          link: "text-accent hover:text-accent/80 font-medium",
          text: "text-text-dark",
          mutedText: "text-muted",
        };
      case "C": // Bold Product
        return {
          main: "min-h-screen flex items-center justify-center p-4",
          container:
            "max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-0 items-center min-h-screen",
          heroSection:
            "hero-gradient text-white flex flex-col items-center justify-center p-8 lg:p-12 rounded-tl-xl rounded-bl-xl",
          cardSection:
            "variant-bold-card rounded-tr-xl rounded-br-xl p-8 lg:p-12",
          card: "bg-transparent border-0 shadow-none p-0",
          input:
            "bg-gray-50 border-gray-200 text-text-dark placeholder:text-muted focus:ring-2 focus:ring-accent",
          button:
            "bg-accent hover:bg-accent/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300",
          link: "text-primary hover:text-primary/80 font-medium",
          text: "text-text-dark",
          mutedText: "text-muted",
        };
      default:
        return getVariantClasses();
    }
  };

  const classes = getVariantClasses();

  return (
    <main role="main" className={classes.main}>
      {/* Background Pattern for Glass variant */}
      {variant === "A" && (
        <div className="fixed inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231E4DB7' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>
      )}

      <div className={classes.container}>
        {/* Hero Section */}
        {(variant === "A" || variant === "C") && (
          <div className={classes.heroSection}>
            <img
              src={Logo}
              alt="AccuBooks Enterprise Logo"
              width={variant === "C" ? 160 : 128}
              height={variant === "C" ? 160 : 128}
              loading="lazy"
              className="mb-6 rounded-xl shadow-2xl hover:scale-105 transition-transform duration-300"
            />
            <h2
              className={`text-3xl lg:text-4xl font-bold mb-4 ${variant === "C" ? "text-white" : classes.text}`}
            >
              AccuBooks
            </h2>
            <p
              className={`text-center ${variant === "C" ? "text-gray-300" : classes.mutedText} max-w-md`}
            >
              Enterprise financial operations reimagined. Manage your business
              with confidence and precision.
            </p>
          </div>
        )}

        {/* Auth Card Section */}
        <section aria-label="Sign in" className={classes.cardSection}>
          {/* Theme Selector */}
          <div
            className="flex items-center justify-between mb-6"
            role="radiogroup"
            aria-label="Theme variant"
          >
            <div className="flex items-center gap-3">
              {variant !== "B" && (
                <img
                  src={Logo}
                  alt="AccuBooks Enterprise Logo"
                  width={48}
                  height={48}
                  loading="lazy"
                  className="rounded-lg shadow-md"
                />
              )}
              <div>
                <h1 className={`text-xl font-semibold ${classes.text}`}>
                  Welcome to AccuBooks
                </h1>
                <p className={`text-sm ${classes.mutedText}`}>
                  Sign in to manage your business finances
                </p>
              </div>
            </div>

            {/* Variant Selector */}
            <div className="flex gap-2" aria-hidden="true">
              <button
                onClick={() => setVariant("A")}
                aria-label="Glass variant"
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                  variant === "A"
                    ? "bg-primary border-primary ring-2 ring-primary/50"
                    : "bg-white border-gray-300 hover:border-primary"
                }`}
                role="radio"
                aria-checked={variant === "A"}
              />
              <button
                onClick={() => setVariant("B")}
                aria-label="Minimal variant"
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                  variant === "B"
                    ? "bg-primary border-primary ring-2 ring-primary/50"
                    : "bg-white border-gray-300 hover:border-primary"
                }`}
                role="radio"
                aria-checked={variant === "B"}
              />
              <button
                onClick={() => setVariant("C")}
                aria-label="Bold variant"
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                  variant === "C"
                    ? "bg-accent border-accent ring-2 ring-accent/50"
                    : "bg-white border-gray-300 hover:border-accent"
                }`}
                role="radio"
                aria-checked={variant === "C"}
              />
            </div>
          </div>

          <Card className={classes.card}>
            <form onSubmit={handleSubmit} aria-label="Login form">
              <div className="text-center mb-4">
                <img
                  src={Logo}
                  alt="AccuBooks Enterprise Logo"
                  className="mx-auto mb-2 h-20 w-auto drop-shadow-sm"
                />
              </div>
              <CardContent className="space-y-6">
                {error && (
                  <Alert
                    variant="destructive"
                    className="border-0 shadow-md"
                    aria-live="polite"
                  >
                    <AlertDescription className="text-sm font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className={`text-sm font-semibold ${classes.text}`}
                  >
                    Email Address
                  </Label>
                  <InputWithIcon
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    icon={<Mail className="w-4 h-4" />}
                    className={classes.input}
                    aria-invalid={error ? "true" : "false"}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className={`text-sm font-semibold ${classes.text}`}
                    >
                      Password
                    </Label>
                    <Link
                      to="/forgot-password"
                      className={`text-sm ${classes.link} hover:underline`}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <InputWithIcon
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      icon={<Lock className="w-4 h-4" />}
                      className={classes.input}
                      aria-invalid={error ? "true" : "false"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-accent transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className={`text-sm ${classes.mutedText}`}>
                      Remember me
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  className={`w-full py-3 font-medium transition-all duration-300 ${
                    isLoading
                      ? "opacity-75 cursor-not-allowed"
                      : "hover:scale-[1.02]"
                  } ${classes.button} text-black`}
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <div className={`text-center text-sm ${classes.mutedText}`}>
                  Don't have an account?{" "}
                  <Link to="/register" className={classes.link}>
                    Sign up
                  </Link>
                </div>
              </CardContent>
            </form>
          </Card>

          {/* Footer */}
          <footer className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
              <Link
                to="/privacy"
                className={
                  classes.mutedText + " hover:text-accent transition-colors"
                }
              >
                Privacy Policy
              </Link>
              <span className="hidden sm:inline text-gray-400">•</span>
              <Link
                to="/terms"
                className={
                  classes.mutedText + " hover:text-accent transition-colors"
                }
              >
                Terms of Service
              </Link>
            </div>
            <p className={`text-center text-xs ${classes.mutedText} mt-4`}>
              © 2025 AccuBooks. All rights reserved.
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}
