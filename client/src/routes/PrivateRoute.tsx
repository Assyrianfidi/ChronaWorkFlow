import React from 'react';
// @ts-ignore
import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
// @ts-ignore
import { useAuth } from '../contexts/AuthContext.js.js';
// @ts-ignore
import Unauthorized from '../pages/Unauthorized.js.js';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

// @ts-ignore
const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if requiredRole is specified
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];

    if (!allowedRoles.includes(user.role)) {
      return <Unauthorized />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
