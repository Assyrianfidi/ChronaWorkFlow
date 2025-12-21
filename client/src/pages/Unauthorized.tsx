import React from "react";

declare global {
  interface Window {
    [key: string]: any;
  }
}

import { Link } from "react-router-dom";
import { ShieldX, Home, ArrowLeft } from "lucide-react";
import { EnterpriseButton } from "../components/ui/EnterpriseButton";

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          You don&apos;t have permission to access this page. Please contact
          your administrator if you believe this is an error.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <EnterpriseButton
            variant="primary"
            className="w-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </EnterpriseButton>

          <Link to="/dashboard">
            <EnterpriseButton variant="secondary" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Dashboard Home
            </EnterpriseButton>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-1">Need Help?</h3>
          <p className="text-sm text-blue-700">
            If you need access to this page, please contact your system
            administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
