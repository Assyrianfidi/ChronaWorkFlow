import React, { useState } from 'react';
// @ts-ignore
import * as React from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
// @ts-ignore
import { cn } from '../../lib/utils.js.js';

export interface EnterpriseInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  floatingLabel?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  showPasswordToggle?: boolean;
  strengthMeter?: boolean;
  loading?: boolean;
}

const EnterpriseInput = React.forwardRef<
  HTMLInputElement,
  EnterpriseInputProps
>(
  (
    {
      className,
      type,
      label,
      error,
      helperText,
      floatingLabel = false,
      icon,
      iconPosition = "left",
      showPasswordToggle = false,
      strengthMeter = false,
      loading = false,
      value,
      onChange,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      setHasValue(!!value);
    }, [value]);

    const inputType = type === "password" && showPassword ? "text" : type;
    const showFloatingLabel = floatingLabel && (isFocused || hasValue);

    // Password strength calculation
    const calculatePasswordStrength = (password: string) => {
      if (!password) return { score: 0, label: "Weak", color: "bg-red-500" };

      let score = 0;
      if (password.length >= 8) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      const strengthLevels = [
        { score: 0, label: "Weak", color: "bg-red-500" },
        { score: 1, label: "Weak", color: "bg-red-500" },
        { score: 2, label: "Fair", color: "bg-orange-500" },
        { score: 3, label: "Good", color: "bg-yellow-500" },
        { score: 4, label: "Strong", color: "bg-green-500" },
        { score: 5, label: "Very Strong", color: "bg-green-600" },
      ];

      return strengthLevels[score] || strengthLevels[0];
    };

    const passwordStrength =
      type === "password" && value
// @ts-ignore
        ? calculatePasswordStrength(value as string)
        : null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      onChange?.(e);
    };

    return (
      <div className="relative">
        {/* Label */}
        {label && !floatingLabel && (
          <label
            className={cn(
              "block text-sm font-medium mb-2 transition-colors",
              error ? "text-red-600" : "text-gray-700",
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* Floating Label */}
          {floatingLabel && label && (
            <label
              className={cn(
                "absolute left-3 transition-all duration-200 bg-white px-1 pointer-events-none z-10",
                showFloatingLabel
                  ? "text-xs -top-2 text-blue-600"
                  : "text-sm top-3 text-gray-500",
              )}
            >
              {label}
            </label>
          )}

          {/* Left Icon */}
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            type={inputType}
            className={cn(
              "w-full px-3 py-2 border rounded-lg transition-all duration-200",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:bg-gray-50 disabled:text-gray-500",
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              showPasswordToggle && "pr-10",
              floatingLabel && "pt-3",
              error
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 hover:border-gray-400",
              loading && "opacity-60",
              className,
            )}
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            onChange={handleInputChange}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            value={value}
            {...props}
          />

          {/* Right Icon */}
          {icon && iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Password Toggle */}
          {showPasswordToggle && type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Loading State */}
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {/* Status Icons */}
          {!loading && error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}

          {!loading && !error && hasValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Password Strength Meter */}
        {strengthMeter && type === "password" && hasValue && (
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Password Strength</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  passwordStrength?.color.replace("bg-", "text-"),
                )}
              >
                {passwordStrength?.label}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  passwordStrength?.color,
                )}
                style={{ width: `${(passwordStrength?.score || 0) * 20}%` }}
              />
            </div>
          </div>
        )}

        {/* Helper Text / Error Message */}
        {(helperText || error) && (
          <p
            className={cn(
              "text-xs mt-1",
              error ? "text-red-600" : "text-gray-500",
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

EnterpriseInput.displayName = "EnterpriseInput";

export { EnterpriseInput };
