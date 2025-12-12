import React, { useState } from 'react';
// @ts-ignore
import * as React from "react";
// @ts-ignore
import { cn } from '../../lib/utils.js.js';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

// Toast Types
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

// Toast Context
interface ToastContextType {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined,
);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Toast Provider
// @ts-ignore
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Toast Container
// @ts-ignore
const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
};

// Individual Toast Component
// @ts-ignore
const Toast: React.FC<ToastProps> = ({
  type,
  title,
  description,
  action,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);

  React.useEffect(() => {
    // Enter animation
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss?.();
    }, 200);
  };

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-success-50",
          borderColor: "border-success-200",
          icon: CheckCircle,
          iconColor: "text-success-600",
          titleColor: "text-success-900",
          descriptionColor: "text-success-700",
        };
      case "error":
        return {
          bgColor: "bg-error-50",
          borderColor: "border-error-200",
          icon: AlertCircle,
          iconColor: "text-error-600",
          titleColor: "text-error-900",
          descriptionColor: "text-error-700",
        };
      case "warning":
        return {
          bgColor: "bg-warning-50",
          borderColor: "border-warning-200",
          icon: AlertTriangle,
          iconColor: "text-warning-600",
          titleColor: "text-warning-900",
          descriptionColor: "text-warning-700",
        };
      case "info":
        return {
          bgColor: "bg-info-50",
          borderColor: "border-info-200",
          icon: Info,
          iconColor: "text-info-600",
          titleColor: "text-info-900",
          descriptionColor: "text-info-700",
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-200",
        config.bgColor,
        config.borderColor,
        isVisible && !isLeaving && "animate-slide-in-from-right",
        isLeaving && "animate-slide-out-to-right opacity-0",
      )}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.iconColor)} />

      <div className="flex-1 min-w-0">
        <h4 className={cn("text-sm font-semibold", config.titleColor)}>
          {title}
        </h4>
        {description && (
          <p className={cn("text-sm mt-1", config.descriptionColor)}>
            {description}
          </p>
        )}

        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              "text-sm font-medium mt-2 hover:underline",
              config.titleColor,
            )}
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className={cn(
          "flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors",
          config.descriptionColor,
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Hook for easy usage
export const toast = {
  success: (
    title: string,
    description?: string,
    options?: Partial<
      Omit<ToastProps, "id" | "type" | "title" | "description">
    >,
  ) => {
    const { addToast } = useToast();
    addToast({ type: "success", title, description, ...options });
  },
  error: (
    title: string,
    description?: string,
    options?: Partial<
      Omit<ToastProps, "id" | "type" | "title" | "description">
    >,
  ) => {
    const { addToast } = useToast();
    addToast({ type: "error", title, description, ...options });
  },
  warning: (
    title: string,
    description?: string,
    options?: Partial<
      Omit<ToastProps, "id" | "type" | "title" | "description">
    >,
  ) => {
    const { addToast } = useToast();
    addToast({ type: "warning", title, description, ...options });
  },
  info: (
    title: string,
    description?: string,
    options?: Partial<
      Omit<ToastProps, "id" | "type" | "title" | "description">
    >,
  ) => {
    const { addToast } = useToast();
    addToast({ type: "info", title, description, ...options });
  },
};

// Toast Action Component
interface ToastActionProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
}

// @ts-ignore
export const ToastAction: React.FC<ToastActionProps> = ({
  children,
  onClick,
  variant = "default",
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
        variant === "destructive"
          ? "bg-error-100 text-error-700 hover:bg-error-200"
          : "bg-primary-100 text-primary-700 hover:bg-primary-200",
        "h-8 px-3",
      )}
    >
      {children}
    </button>
  );
};

// Toast Close Component
// @ts-ignore
export const ToastClose: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="absolute right-2 top-2 rounded-md p-1 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <X className="h-4 w-4" />
    </button>
  );
};

// Toast Title Component
// @ts-ignore
export const ToastTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="text-sm font-semibold text-gray-900">{children}</div>;
};

// Toast Description Component
// @ts-ignore
export const ToastDescription: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="text-sm text-gray-600">{children}</div>;
};

export default ToastProvider;
