/**
 * Perfect UI Components System V3
 * Enterprise-grade components with perfect polish, micro-interactions, and accessibility
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useSuperAccessibility } from '@/components/accessibility/super-accessibility';
import { useThreatAdaptiveUI } from '@/components/security/threat-adaptive-ui';
import { useSmartAutoLazy } from '@/components/performance/smart-auto-lazy';
import { useGPUAcceleration } from '@/components/performance/gpu-acceleration';

// Perfect Button Component
interface PerfectButtonProps {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "ghost"
    | "danger"
    | "success";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  rounded?: boolean;
  glow?: boolean;
  ripple?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  accessibility?: {
    announceOnClick?: boolean;
    keyboardNavigation?: boolean;
    focusVisible?: boolean;
  };
}

export const PerfectButton: React.FC<PerfectButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  rounded = false,
  glow = false,
  ripple = true,
  onClick,
  className = "",
  ariaLabel,
  accessibility = {},
}) => {
  const { announceToScreenReader } = useSuperAccessibility();
  const { securityLevel } = useThreatAdaptiveUI();
  const [ripples, setRipples] = useState<
    Array<{ id: number; x: number; y: number; size: number }>
  >([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdCounter = useRef(0);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;

      // Create ripple effect
      if (ripple) {
        const button = buttonRef.current;
        if (button) {
          const rect = button.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          const x = event.clientX - rect.left - size / 2;
          const y = event.clientY - rect.top - size / 2;

          const newRipple = {
            id: rippleIdCounter.current++,
            x,
            y,
            size,
          };

          setRipples((prev) => [...prev, newRipple]);

          // Remove ripple after animation
          setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
          }, 600);
        }
      }

      // Announce to screen reader if enabled
      if (accessibility.announceOnClick && ariaLabel) {
        announceToScreenReader(`${ariaLabel} activated`);
      }

      // Execute click handler
      onClick?.();
    },
    [
      disabled,
      loading,
      ripple,
      accessibility.announceOnClick,
      ariaLabel,
      announceToScreenReader,
      onClick,
    ],
  );

  const getVariantClasses = useCallback(() => {
    const baseClasses = {
      primary:
        "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 hover:from-blue-700 hover:to-blue-800",
      secondary:
        "bg-gradient-to-r from-gray-600 to-gray-700 text-white border-gray-600 hover:from-gray-700 hover:to-gray-800",
      tertiary:
        "bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-600 hover:from-purple-700 hover:to-purple-800",
      ghost:
        "bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900",
      danger:
        "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 hover:from-red-700 hover:to-red-800",
      success:
        "bg-gradient-to-r from-green-600 to-green-700 text-white border-green-600 hover:from-green-700 hover:to-green-800",
    };
    return baseClasses[variant];
  }, [variant]);

  const getSizeClasses = useCallback(() => {
    const baseClasses = {
      xs: "px-2 py-1 text-xs font-medium",
      sm: "px-3 py-1.5 text-sm font-medium",
      md: "px-4 py-2 text-sm font-medium",
      lg: "px-6 py-3 text-base font-medium",
      xl: "px-8 py-4 text-lg font-medium",
    };
    return baseClasses[size];
  }, [size]);

  const isDisabled = disabled || loading || securityLevel.level >= 4;

  return (
    <motion.button
      ref={buttonRef}
      className={`
        relative overflow-hidden inline-flex items-center justify-center
        border font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? "w-full" : ""}
        ${rounded ? "rounded-full" : "rounded-lg"}
        ${glow ? "shadow-lg hover:shadow-xl" : "shadow-sm hover:shadow-md"}
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute bg-white opacity-30 rounded-full pointer-events-none"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Loading spinner */}
      {loading && (
        <motion.svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </motion.svg>
      )}

      {/* Icon */}
      {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}

      {/* Button content */}
      <span className={loading ? "opacity-70" : ""}>{children}</span>

      {/* Icon */}
      {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
    </motion.button>
  );
};

// Perfect Card Component
interface PerfectCardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "glass";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  rounded?: boolean;
  hoverable?: boolean;
  clickable?: boolean;
  glow?: boolean;
  gradient?: boolean;
  onClick?: () => void;
  className?: string;
  accessibility?: {
    role?: string;
    label?: string;
    describedBy?: string;
  };
}

export const PerfectCard: React.FC<PerfectCardProps> = ({
  children,
  variant = "default",
  padding = "md",
  rounded = true,
  hoverable = true,
  clickable = false,
  glow = false,
  gradient = false,
  onClick,
  className = "",
  accessibility = {},
}) => {
  const { createLiveRegion } = useSuperAccessibility();
  const cardRef = useRef<HTMLDivElement>(null);

  const getVariantClasses = useCallback(() => {
    const baseClasses = {
      default: "bg-white border border-gray-200",
      elevated: "bg-white border border-gray-200 shadow-lg",
      outlined: "bg-transparent border-2 border-gray-300",
      glass: "bg-white/80 backdrop-blur-lg border border-white/20",
    };
    return baseClasses[variant];
  }, [variant]);

  const getPaddingClasses = useCallback(() => {
    const baseClasses = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    };
    return baseClasses[padding];
  }, [padding]);

  const handleClick = useCallback(() => {
    if (clickable && onClick) {
      // Create live region for feedback
      const liveRegion = createLiveRegion();
      liveRegion.announce("Card activated");
      onClick();
    }
  }, [clickable, onClick, createLiveRegion]);

  return (
    <motion.div
      ref={cardRef}
      className={`
        relative overflow-hidden transition-all duration-300
        ${rounded ? "rounded-xl" : "rounded-lg"}
        ${hoverable ? "hover:shadow-xl" : ""}
        ${clickable ? "cursor-pointer" : ""}
        ${glow ? "shadow-xl" : "shadow-sm"}
        ${gradient ? "bg-gradient-to-br from-blue-50 to-purple-50" : ""}
        ${getVariantClasses()}
        ${getPaddingClasses()}
        ${className}
      `}
      whileHover={hoverable ? { y: -2 } : {}}
      whileTap={clickable ? { scale: 0.98 } : {}}
      onClick={handleClick}
      role={accessibility.role || (clickable ? "button" : undefined)}
      aria-label={accessibility.label}
      aria-describedby={accessibility.describedBy}
      tabIndex={clickable ? 0 : undefined}
    >
      {/* Subtle gradient overlay for glass effect */}
      {variant === "glass" && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Hover glow effect */}
      {glow && hoverable && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl opacity-0 pointer-events-none"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};

// Perfect Input Component
interface PerfectInputProps {
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  className?: string;
  accessibility?: {
    announceChanges?: boolean;
    autoComplete?: string;
    inputMode?:
      | "none"
      | "text"
      | "decimal"
      | "numeric"
      | "tel"
      | "search"
      | "email"
      | "url";
  };
}

export const PerfectInput: React.FC<PerfectInputProps> = ({
  type = "text",
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  label,
  error,
  helper,
  required = false,
  disabled = false,
  readonly = false,
  size = "md",
  variant = "default",
  icon,
  iconPosition = "left",
  loading = false,
  className = "",
  accessibility = {},
}) => {
  const { announceToScreenReader } = useSuperAccessibility();
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const currentValue = value !== undefined ? value : internalValue;
  const hasValue = currentValue.length > 0;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;

      if (value === undefined) {
        setInternalValue(newValue);
      }

      onChange?.(newValue);

      // Announce changes if enabled
      if (accessibility.announceChanges && label) {
        announceToScreenReader(`${label}: ${newValue}`);
      }
    },
    [
      value,
      onChange,
      accessibility.announceChanges,
      label,
      announceToScreenReader,
    ],
  );

  const handleFocus = useCallback(() => {
    setFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    onBlur?.();
  }, [onBlur]);

  const getSizeClasses = useCallback(() => {
    const baseClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-4 py-3 text-base",
    };
    return baseClasses[size];
  }, [size]);

  const getVariantClasses = useCallback(() => {
    const baseClasses = {
      default:
        "bg-white border border-gray-300 focus:border-blue-500 focus:ring-blue-500",
      filled:
        "bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500",
      outlined: "bg-transparent border-2 border-gray-300 focus:border-blue-500",
    };
    return baseClasses[variant];
  }, [variant]);

  const inputId = useMemo(
    () => `input-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <motion.label
          htmlFor={inputId}
          className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
            error ? "text-red-600" : focused ? "text-blue-600" : "text-gray-700"
          }`}
          animate={{ scale: focused ? 1.02 : 1 }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Left icon */}
        {icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {/* Input */}
        <motion.input
          ref={inputRef}
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={currentValue}
          defaultValue={defaultValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          className={`
            w-full transition-all duration-200 rounded-lg border
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon && iconPosition === "left" ? "pl-10" : ""}
            ${icon && iconPosition === "right" ? "pr-10" : ""}
            ${getSizeClasses()}
            ${getVariantClasses()}
            ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
          `}
          autoComplete={accessibility.autoComplete}
          inputMode={accessibility.inputMode}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helper
                ? `${inputId}-helper`
                : undefined
          }
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />

        {/* Right icon */}
        {(icon && iconPosition === "right") || loading ? (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {loading ? (
              <motion.div
                className="animate-spin h-4 w-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </motion.div>
            ) : (
              icon
            )}
          </div>
        ) : null}

        {/* Floating label effect for filled variant */}
        {variant === "filled" && (
          <motion.div
            className="absolute left-3 top-2 text-xs text-gray-500 pointer-events-none"
            animate={{
              y: hasValue || focused ? -20 : 0,
              scale: hasValue || focused ? 0.85 : 1,
              opacity: hasValue || focused ? 0 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {placeholder}
          </motion.div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-600"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {error}
        </motion.p>
      )}

      {/* Helper text */}
      {helper && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
          {helper}
        </p>
      )}
    </div>
  );
};

// Perfect Modal Component
interface PerfectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closable?: boolean;
  backdrop?: boolean;
  centered?: boolean;
  animation?: "fade" | "slide" | "zoom" | "flip";
  className?: string;
  accessibility?: {
    closeOnEscape?: boolean;
    trapFocus?: boolean;
    restoreFocus?: boolean;
  };
}

export const PerfectModal: React.FC<PerfectModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closable = true,
  backdrop = true,
  centered = true,
  animation = "fade",
  className = "",
  accessibility = { closeOnEscape: true, trapFocus: true, restoreFocus: true },
}) => {
  const { announceToScreenReader } = useSuperAccessibility();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus element
  useEffect(() => {
    if (isOpen && accessibility.restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    return () => {
      if (!isOpen && accessibility.restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, accessibility.restoreFocus]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && accessibility.closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      announceToScreenReader(title ? `Modal opened: ${title}` : "Modal opened");
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (isOpen) {
        announceToScreenReader("Modal closed");
      }
    };
  }, [
    isOpen,
    onClose,
    title,
    accessibility.closeOnEscape,
    announceToScreenReader,
  ]);

  // Focus trapping
  useEffect(() => {
    if (isOpen && accessibility.trapFocus && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) as NodeListOf<HTMLElement>;

      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen, accessibility.trapFocus]);

  const getSizeClasses = useCallback(() => {
    const baseClasses = {
      sm: "max-w-md",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
      full: "max-w-full mx-4",
    };
    return baseClasses[size];
  }, [size]);

  const getAnimationVariants = useCallback(() => {
    const variants = {
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      },
      slide: {
        initial: { y: -50, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -50, opacity: 0 },
      },
      zoom: {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.8, opacity: 0 },
      },
      flip: {
        initial: { rotateY: -90, opacity: 0 },
        animate: { rotateY: 0, opacity: 1 },
        exit: { rotateY: 90, opacity: 0 },
      },
    };
    return variants[animation];
  }, [animation]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget && backdrop) {
        onClose();
      }
    },
    [onClose, backdrop],
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        {backdrop && (
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          />
        )}

        {/* Modal */}
        <motion.div
          ref={modalRef}
          className={`
            relative bg-white rounded-xl shadow-2xl overflow-hidden
            ${centered ? "flex items-center justify-center" : "flex items-start justify-center pt-16"}
            ${getSizeClasses()}
            ${className}
          `}
          variants={getAnimationVariants()}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          {/* Header */}
          {(title || closable) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              {title && (
                <h2
                  id="modal-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  {title}
                </h2>
              )}

              {closable && (
                <motion.button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close modal"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Perfect Avatar Component
interface PerfectAvatarProps {
  src?: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  fallback?: string;
  variant?: "circle" | "square" | "rounded";
  status?: "online" | "offline" | "away" | "busy";
  showStatus?: boolean;
  className?: string;
  onClick?: () => void;
  accessibility?: {
    label?: string;
    announceStatus?: boolean;
  };
}

export const PerfectAvatar: React.FC<PerfectAvatarProps> = ({
  src,
  alt,
  size = "md",
  fallback,
  variant = "circle",
  status,
  showStatus = false,
  className = "",
  onClick,
  accessibility = {},
}) => {
  const { announceToScreenReader } = useSuperAccessibility();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getSizeClasses = useCallback(() => {
    const baseClasses = {
      xs: "w-6 h-6 text-xs",
      sm: "w-8 h-8 text-sm",
      md: "w-10 h-10 text-base",
      lg: "w-12 h-12 text-lg",
      xl: "w-16 h-16 text-xl",
      "2xl": "w-20 h-20 text-2xl",
    };
    return baseClasses[size];
  }, [size]);

  const getVariantClasses = useCallback(() => {
    const baseClasses = {
      circle: "rounded-full",
      square: "rounded-none",
      rounded: "rounded-lg",
    };
    return baseClasses[variant];
  }, [variant]);

  const getStatusColor = useCallback(() => {
    const colors = {
      online: "bg-green-500",
      offline: "bg-gray-400",
      away: "bg-yellow-500",
      busy: "bg-red-500",
    };
    return colors[status!];
  }, [status]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();

      // Announce status if enabled
      if (accessibility.announceStatus && status) {
        announceToScreenReader(`User status: ${status}`);
      }
    }
  }, [onClick, accessibility.announceStatus, status, announceToScreenReader]);

  const showImage = src && !imageError && imageLoaded;
  const showFallback = !src || imageError;

  return (
    <div
      className={`
        relative inline-flex items-center justify-center
        bg-gray-100 text-gray-600 font-medium
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      aria-label={accessibility.label || alt}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Image */}
      {showImage && (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover ${getVariantClasses()}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}

      {/* Fallback */}
      {showFallback && (
        <span className="truncate">
          {fallback || (alt ? alt[0]?.toUpperCase() : "?")}
        </span>
      )}

      {/* Status indicator */}
      {showStatus && status && (
        <motion.div
          className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor()} rounded-full border-2 border-white`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        />
      )}

      {/* Loading skeleton */}
      {src && !imageLoaded && !imageError && (
        <div
          className={`absolute inset-0 bg-gray-200 ${getVariantClasses()} animate-pulse`}
        />
      )}
    </div>
  );
};

// Perfect Badge Component
interface PerfectBadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info";
  size?: "xs" | "sm" | "md" | "lg";
  rounded?: boolean;
  dot?: boolean;
  count?: number;
  maxCount?: number;
  className?: string;
  accessibility?: {
    announceCount?: boolean;
  };
}

export const PerfectBadge: React.FC<PerfectBadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  rounded = true,
  dot = false,
  count,
  maxCount = 99,
  className = "",
  accessibility = {},
}) => {
  const { announceToScreenReader } = useSuperAccessibility();

  const getVariantClasses = useCallback(() => {
    const baseClasses = {
      default: "bg-gray-100 text-gray-800",
      primary: "bg-blue-100 text-blue-800",
      secondary: "bg-purple-100 text-purple-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
      info: "bg-cyan-100 text-cyan-800",
    };
    return baseClasses[variant];
  }, [variant]);

  const getSizeClasses = useCallback(() => {
    const baseClasses = {
      xs: "px-1.5 py-0.5 text-xs",
      sm: "px-2 py-1 text-xs",
      md: "px-2.5 py-1 text-sm",
      lg: "px-3 py-1.5 text-sm",
    };
    return baseClasses[size];
  }, [size]);

  const displayCount = useMemo(() => {
    if (count === undefined) return null;
    return count > maxCount ? `${maxCount}+` : count.toString();
  }, [count, maxCount]);

  const showDot = dot && !children && !displayCount;

  useEffect(() => {
    if (accessibility.announceCount && displayCount) {
      announceToScreenReader(`Badge count: ${displayCount}`);
    }
  }, [displayCount, accessibility.announceCount, announceToScreenReader]);

  if (showDot) {
    return (
      <motion.div
        className={`
          w-2 h-2 rounded-full
          ${getVariantClasses()}
          ${className}
        `}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    );
  }

  return (
    <motion.div
      className={`
        inline-flex items-center justify-center font-medium
        ${rounded ? "rounded-full" : "rounded-md"}
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {displayCount || children}
    </motion.div>
  );
};

// Perfect Skeleton Component
interface PerfectSkeletonProps {
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
  animation?: "pulse" | "wave" | "none";
}

export const PerfectSkeleton: React.FC<PerfectSkeletonProps> = ({
  variant = "text",
  width,
  height,
  lines = 1,
  className = "",
  animation = "pulse",
}) => {
  const getVariantClasses = useCallback(() => {
    const baseClasses = {
      text: "rounded",
      rectangular: "rounded-md",
      circular: "rounded-full",
    };
    return baseClasses[variant];
  }, [variant]);

  const getAnimationClasses = useCallback(() => {
    const baseClasses = {
      pulse: "animate-pulse",
      wave: "animate-shimmer",
      none: "",
    };
    return baseClasses[animation];
  }, [animation]);

  const style = useMemo(() => {
    const computedStyle: React.CSSProperties = {};
    if (width)
      computedStyle.width = typeof width === "number" ? `${width}px` : width;
    if (height)
      computedStyle.height =
        typeof height === "number" ? `${height}px` : height;
    return computedStyle;
  }, [width, height]);

  if (variant === "text" && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={`
              bg-gray-200 rounded
              ${getAnimationClasses()}
              ${index === lines - 1 ? "w-3/4" : "w-full"}
            `}
            style={{ height: "1rem" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        bg-gray-200
        ${getVariantClasses()}
        ${getAnimationClasses()}
        ${className}
      `}
      style={style}
    />
  );
};

// Perfect Tooltip Component
interface PerfectTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  trigger?: "hover" | "click" | "focus";
  delay?: number;
  arrow?: boolean;
  className?: string;
  accessibility?: {
    describedBy?: boolean;
  };
}

export const PerfectTooltip: React.FC<PerfectTooltipProps> = ({
  content,
  children,
  placement = "top",
  trigger = "hover",
  delay = 200,
  arrow = true,
  className = "",
  accessibility = { describedBy: true },
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  }, [delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (trigger === "hover") {
      showTooltip();
    }
  }, [trigger, showTooltip]);

  const handleMouseLeave = useCallback(() => {
    if (trigger === "hover") {
      hideTooltip();
    }
  }, [trigger, hideTooltip]);

  const handleClick = useCallback(() => {
    if (trigger === "click") {
      setVisible(!visible);
    }
  }, [trigger, visible]);

  const handleFocus = useCallback(() => {
    if (trigger === "focus") {
      showTooltip();
    }
  }, [trigger, showTooltip]);

  const handleBlur = useCallback(() => {
    if (trigger === "focus") {
      hideTooltip();
    }
  }, [trigger, hideTooltip]);

  const tooltipId = useMemo(
    () => `tooltip-${Math.random().toString(36).substr(2, 9)}`,
    [],
  );

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-describedby={
          accessibility.describedBy && visible ? tooltipId : undefined
        }
      >
        {children}
      </div>

      <AnimatePresence>
        {visible && (
          <motion.div
            id={tooltipId}
            className={`
              absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg
              pointer-events-none select-none
              ${className}
            `}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
          >
            {content}

            {arrow && (
              <div
                className={`
                  absolute w-2 h-2 bg-gray-900 transform rotate-45
                  ${placement === "top" ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" : ""}
                  ${placement === "bottom" ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" : ""}
                  ${placement === "left" ? "right-0 top-1/2 -translate-y-1/2 translate-x-1/2" : ""}
                  ${placement === "right" ? "left-0 top-1/2 -translate-y-1/2 -translate-x-1/2" : ""}
                `}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default {
  PerfectButton,
  PerfectCard,
  PerfectInput,
  PerfectModal,
  PerfectAvatar,
  PerfectBadge,
  PerfectSkeleton,
  PerfectTooltip,
};
