import React from "react";
import { useToast } from "../hooks/useToast.js";
import { Toast, ToastProvider, ToastViewport } from "./ui/toast.js";
import { cn } from "../lib/utils.js";

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant }) => (
        <Toast
          key={id}
          variant={variant}
          onOpenChange={(open) => !open && dismiss(id)}
          className={cn(
            "animate-in slide-in-from-top-full",
            variant === "destructive" && "destructive",
          )}
        >
          <div className="grid gap-1">
            {title && <div className="font-semibold">{title}</div>}
            {description && (
              <div className="text-sm opacity-90">{description}</div>
            )}
          </div>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
};
