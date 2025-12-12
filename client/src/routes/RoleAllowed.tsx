import React from 'react';
// @ts-ignore
import { useAuth } from '../contexts/AuthContext.js.js';
// @ts-ignore
import Unauthorized from '../pages/Unauthorized.js.js';

interface RoleAllowedProps {
  children: React.ReactNode;
  roles: string | string[];
  fallback?: React.ReactNode;
}

// @ts-ignore
const RoleAllowed: React.FC<RoleAllowedProps> = ({
  children,
  roles,
  fallback = <Unauthorized />,
}) => {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, show unauthorized
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Check if user's role is allowed
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const isAllowed = allowedRoles.includes(user.role);

  return isAllowed ? <>{children}</> : <>{fallback}</>;
};

export default RoleAllowed;
