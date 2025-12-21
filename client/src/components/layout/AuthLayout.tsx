import React from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AccuBooksLogo } from "@/components/ui/AccuBooksLogo";

interface AuthLayoutProps {
  className?: string;
  title?: string;
  subtitle?: string;
}

const AuthLayout = React.forwardRef<HTMLDivElement, AuthLayoutProps>(
  ({ className, title, subtitle, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8",
          className,
        )}
        {...props}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-foreground/10" />

        {/* Main Content */}
        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <AccuBooksLogo variant="icon" className="w-16 h-16 text-primary" />
          </div>

          {/* Auth Card */}
          <div className="bg-card/95 text-card-foreground backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-border">
            {/* Header */}
            <div className="text-center mb-8">
              {title && (
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {title}
                </h2>
              )}
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>

            {/* Form Content */}
            <Outlet />
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground text-sm">
              © 2025 AccuBooks. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  },
);
AuthLayout.displayName = "AuthLayout";

export { AuthLayout };
