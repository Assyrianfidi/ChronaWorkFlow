import * as React from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { EnterpriseButton } from "./EnterpriseButton"

interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* Error Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        
        {/* Error Description */}
        <p className="text-gray-600 mb-6">
          {error?.message || "An unexpected error occurred. Please try again or contact support if the problem persists."}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {resetError && (
            <EnterpriseButton
              variant="primary"
              className="w-full"
              onClick={resetError}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </EnterpriseButton>
          )}
          
          <EnterpriseButton
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = "/dashboard"}
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </EnterpriseButton>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-1">Need Help?</h3>
          <p className="text-sm text-blue-700">
            If this problem continues, please contact our support team.
          </p>
        </div>

        {/* Error Details ( Development only ) */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-3 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export default ErrorFallback
