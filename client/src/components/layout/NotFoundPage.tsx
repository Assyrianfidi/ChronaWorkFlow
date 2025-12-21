import React from "react";

declare global {
  interface Window {
    [key: string]: any;
  }
}

import { Link } from "react-router-dom";
import { Home, Search, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccuBooksLogo } from "@/components/ui/AccuBooksLogo";
import { EnterpriseButton } from "@/components/ui/EnterpriseButton";

interface NotFoundPageProps {
  className?: string;
}

const NotFoundPage = React.forwardRef<HTMLDivElement, NotFoundPageProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8",
          className,
        )}
        {...props}
      >
        <div className="max-w-md w-full text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <AccuBooksLogo
              variant="monogram"
              className="w-16 h-16 text-primary"
            />
          </div>

          {/* Error Content */}
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-muted-foreground/30 mb-4">404</h1>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Page Not Found
            </h2>
            <p className="text-muted-foreground mb-8">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved. Let&apos;s get you back on track.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <EnterpriseButton
                variant="primary"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </EnterpriseButton>

              <Link to="/dashboard">
                <EnterpriseButton
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </EnterpriseButton>
              </Link>
            </div>

            <Link to="/search">
              <EnterpriseButton
                variant="ghost"
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search Something
              </EnterpriseButton>
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-12 p-6 bg-card text-card-foreground rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Need Help?
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              If you believe this is an error, please contact our support team.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="mailto:support@accubooks.com"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Email Support
              </a>
              <span className="text-muted-foreground">•</span>
              <a
                href="/help"
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Help Center
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
NotFoundPage.displayName = "NotFoundPage";

export { NotFoundPage };
