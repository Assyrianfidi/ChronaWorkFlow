import * as React from "react"
import { Outlet } from "react-router-dom"
import { cn } from "../../lib/utils"
import { AccuBooksLogo } from "../ui/AccuBooksLogo"

interface AuthLayoutProps {
  className?: string
  title?: string
  subtitle?: string
}

const AuthLayout = React.forwardRef<HTMLDivElement, AuthLayoutProps>(
  ({ className, title, subtitle, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-blue via-blue-600 to-deep-navy py-12 px-4 sm:px-6 lg:px-8",
          className
        )}
        {...props}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
        </div>

        {/* Main Content */}
        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <AccuBooksLogo variant="icon" className="w-16 h-16 text-white" />
          </div>

          {/* Auth Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              {title && (
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Form Content */}
            <Outlet />
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-white/80 text-sm">
              © 2025 AccuBooks. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    )
  }
)
AuthLayout.displayName = "AuthLayout"

export { AuthLayout }
