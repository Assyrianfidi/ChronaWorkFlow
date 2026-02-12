import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, Loader2, Mail, Lock, User, CheckCircle2, XCircle } from "lucide-react";
import Logo from "../assets/chronaworkflow-logo.png";
import { designSystem, cn } from "../styles/designSystem";

/**
 * RegisterPage - CEO-Level SaaS Registration
 * 
 * Clean, modern, accessible registration page following ChronaWorkFlow design system.
 * Includes password strength indicator and validation.
 */
const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Calculate password strength when password changes
    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.fullName, formData.email, formData.password);
      
      // Redirect to dashboard after successful registration
      navigate("/dashboard");
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordsDontMatch = formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword;

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
            Create Your Account
          </h1>
          <p className={designSystem.typography.small}>
            Get started with AccuBooks today
          </p>
        </div>

        {/* Register Card */}
        <div className={designSystem.components.card.base}>
          <div className={designSystem.spacing.cardPadding}>
            <form onSubmit={handleSubmit} className={designSystem.spacing.formSpacing}>
              {/* Error Alert */}
              {error && (
                <div className={designSystem.components.alert.error} role="alert">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Full Name Field */}
              <div className={designSystem.spacing.tightSpacing}>
                <label
                  htmlFor="fullName"
                  className={designSystem.typography.label}
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={cn(
                      designSystem.components.input.base,
                      "pl-10",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                    placeholder="John Doe"
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={handleChange}
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
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={cn(
                      designSystem.components.input.base,
                      "pl-10 pr-10",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                    placeholder="Create a strong password"
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

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password strength:</span>
                      <span className={cn("text-xs font-medium", 
                        passwordStrength <= 1 ? "text-red-600" : 
                        passwordStrength <= 3 ? "text-yellow-600" : "text-green-600"
                      )}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={cn("h-2 rounded-full transition-all duration-300", getPasswordStrengthColor())}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className={designSystem.spacing.tightSpacing}>
                <label
                  htmlFor="confirmPassword"
                  className={designSystem.typography.label}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={cn(
                      designSystem.components.input.base,
                      "pl-10 pr-10",
                      isLoading && "opacity-50 cursor-not-allowed",
                      passwordsMatch && "border-green-300",
                      passwordsDontMatch && "border-red-300"
                    )}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  {passwordsMatch && (
                    <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                  {passwordsDontMatch && (
                    <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
                      <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {passwordsDontMatch && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isLoading || passwordsDontMatch}
                className={cn(
                  designSystem.components.button.primary,
                  "w-full",
                  (isLoading || passwordsDontMatch) && designSystem.components.button.disabled
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>

              {/* Login Link */}
              <div className="text-center">
                <p className={designSystem.typography.small}>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className={designSystem.components.link.primary}
                  >
                    Sign in
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

export default RegisterPage;
