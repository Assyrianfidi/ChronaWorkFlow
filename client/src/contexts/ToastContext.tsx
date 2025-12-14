import React from "react";
import { useToast } from "@/components/hooks/use-toast";

interface ToastContextType {
  showToast: (
    title: string,
    description?: string,
    variant?: "default" | "destructive",
  ) => void;
  showError: (title: string, description?: string) => void;
  showSuccess: (title: string, description?: string) => void;
  showWarning: (title: string, description?: string) => void;
  showInfo: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined,
);

export const useGlobalToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useGlobalToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const { toast } = useToast();

  const showToast = React.useCallback(
    (
      title: string,
      description?: string,
      variant?: "default" | "destructive",
    ) => {
      toast({
        title,
        description,
        variant,
      });
    },
    [toast],
  );

  const showError = React.useCallback(
    (title: string, description?: string) => {
      showToast(title, description, "destructive");
    },
    [showToast],
  );

  const showSuccess = React.useCallback(
    (title: string, description?: string) => {
      showToast(title, description, "default");
    },
    [showToast],
  );

  const showWarning = React.useCallback(
    (title: string, description?: string) => {
      showToast(title, description, "default");
    },
    [showToast],
  );

  const showInfo = React.useCallback(
    (title: string, description?: string) => {
      showToast(title, description, "default");
    },
    [showToast],
  );

  const value: ToastContextType = {
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};
