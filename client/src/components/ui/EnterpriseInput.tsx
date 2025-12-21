import * as React from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
      if (!password)
        return {
          score: 0,
          label: "Weak",
          barClassName: "bg-destructive",
          labelClassName: "text-destructive dark:text-destructive-500",
        };

      let score = 0;
      if (password.length >= 8) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      const strengthConfig = [
        {
          score: 0,
          label: "Very Weak",
          barClassName: "bg-destructive",
          labelClassName: "text-destructive dark:text-destructive-500",
        },
        {
          score: 1,
          label: "Weak",
          barClassName: "bg-destructive",
          labelClassName: "text-destructive dark:text-destructive-500",
        },
        {
          score: 2,
          label: "Fair",
          barClassName: "bg-warning",
          labelClassName: "text-warning-700 dark:text-warning",
        },
        {
          score: 3,
          label: "Good",
          barClassName: "bg-warning",
          labelClassName: "text-warning-700 dark:text-warning",
        },
        {
          score: 4,
          label: "Strong",
          barClassName: "bg-success",
          labelClassName: "text-success-700 dark:text-success",
        },
        {
          score: 5,
          label: "Very Strong",
          barClassName: "bg-success",
          labelClassName: "text-success-700 dark:text-success",
        },
      ];

      return strengthConfig[score] || strengthConfig[0];
    };

    const passwordStrength =
      type === "password" && value
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
              error
                ? "text-destructive dark:text-destructive-500"
                : "text-foreground",
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
                "absolute left-3 transition-all duration-200 bg-background px-1 pointer-events-none z-10",
                showFloatingLabel
                  ? "text-xs -top-2 text-primary"
                  : "text-sm top-3 text-muted-foreground",
              )}
            >
              {label}
            </label>
          )}

          {/* Left Icon */}
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input */}

          <label htmlFor="input-dts1club6" className="sr-only">
            Field
          </label>
          <input
            id="input-dts1club6"
            type={inputType}
            className={cn(
              "w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-shadow",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-60",
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              showPasswordToggle && "pr-10",
              floatingLabel && "pt-3",
              error
                ? "border-destructive focus-visible:ring-destructive/30"
                : "border-input hover:border-border",
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
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}

          {/* Password Toggle */}
          {showPasswordToggle && type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
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
              <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {/* Status Icons */}
          {!loading && error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive dark:text-destructive-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}

          {!loading && !error && hasValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success-700 dark:text-success">
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Password Strength Meter */}
        {strengthMeter && type === "password" && hasValue && (
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">
                Password Strength
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  passwordStrength?.labelClassName,
                )}
              >
                {passwordStrength?.label}
              </span>
            </div>
            <div className="w-full bg-muted/40 rounded-full h-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  passwordStrength?.barClassName,
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
              error
                ? "text-destructive dark:text-destructive-500"
                : "text-muted-foreground",
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
