import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

// Toast Types
export type ToastType = "success" | "error" | "warning" | "info";

export type ToastVariant =
  | "default"
  | "destructive"
  | "success"
  | "warning"
  | "info";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

let enqueueToast:
  | ((toast: Omit<ToastProps, "id" | "type"> & { type: ToastType }) => void)
  | null = null;

export function toast({
  title,
  description,
  variant = "default",
  duration,
  action,
}: ToastInput) {
  const type: ToastType =
    variant === "destructive"
      ? "error"
      : variant === "success"
        ? "success"
        : variant === "warning"
          ? "warning"
          : variant === "info"
            ? "info"
            : "success";

  enqueueToast?.({ type, title, description, duration, action });
}

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

// Toast helpers (hook-based, hook-safe)
export const useToastActions = () => {
  const { addToast } = useToast();

  const success = React.useCallback(
    (
      title: string,
      description?: string,
      options?: Partial<
        Omit<ToastProps, "id" | "type" | "title" | "description">
      >,
    ) => addToast({ type: "success", title, description, ...options }),
    [addToast],
  );

  const error = React.useCallback(
    (
      title: string,
      description?: string,
      options?: Partial<
        Omit<ToastProps, "id" | "type" | "title" | "description">
      >,
    ) => addToast({ type: "error", title, description, ...options }),
    [addToast],
  );

  const warning = React.useCallback(
    (
      title: string,
      description?: string,
      options?: Partial<
        Omit<ToastProps, "id" | "type" | "title" | "description">
      >,
    ) => addToast({ type: "warning", title, description, ...options }),
    [addToast],
  );

  const info = React.useCallback(
    (
      title: string,
      description?: string,
      options?: Partial<
        Omit<ToastProps, "id" | "type" | "title" | "description">
      >,
    ) => addToast({ type: "info", title, description, ...options }),
    [addToast],
  );

  return { success, error, warning, info };
};

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<ToastProps, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: ToastProps = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after duration
      if (toast.duration !== 0) {
        setTimeout(() => {
          removeToast(id);
        }, toast.duration || 5000);
      }
    },
    [removeToast],
  );

  React.useEffect(() => {
    enqueueToast = (t) => {
      addToast({ ...t, type: t.type });
    };
    return () => {
      enqueueToast = null;
    };
  }, [addToast]);

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
          bgColor: "bg-success/10",
          borderColor: "border-success/25",
          icon: CheckCircle,
          iconColor: "text-success-700 dark:text-success",
          titleColor: "text-foreground",
          descriptionColor: "text-muted-foreground",
        };
      case "error":
        return {
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/25",
          icon: AlertCircle,
          iconColor: "text-destructive dark:text-destructive-500",
          titleColor: "text-foreground",
          descriptionColor: "text-muted-foreground",
        };
      case "warning":
        return {
          bgColor: "bg-warning/10",
          borderColor: "border-warning/25",
          icon: AlertTriangle,
          iconColor: "text-warning-700 dark:text-warning",
          titleColor: "text-foreground",
          descriptionColor: "text-muted-foreground",
        };
      case "info":
        return {
          bgColor: "bg-info/10",
          borderColor: "border-info/25",
          icon: Info,
          iconColor: "text-info",
          titleColor: "text-foreground",
          descriptionColor: "text-muted-foreground",
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-elevated transition-all duration-200",
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
          "flex-shrink-0 p-1 rounded-md hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "text-muted-foreground",
        )}
        aria-label="Button button"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Action Component
interface ToastActionProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
}

export const ToastAction: React.FC<ToastActionProps> = ({
  children,
  onClick,
  variant = "default",
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-60",
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
export const ToastClose: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="absolute right-2 top-2 rounded-md p-1 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
      aria-label="Button button"
    >
      <X className="h-4 w-4" />
    </button>
  );
};

// Toast Title Component
export const ToastTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="text-sm font-semibold text-gray-900">{children}</div>;
};

// Toast Description Component
export const ToastDescription: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="text-sm text-gray-600">{children}</div>;
};

export default ToastProvider;
