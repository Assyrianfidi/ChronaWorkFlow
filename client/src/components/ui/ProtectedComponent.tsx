import React from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface ProtectedComponentProps {
  permission?: string;
  role?: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
  disableInsteadOfHide?: boolean;
  tooltip?: string;
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  permission,
  role,
  fallback = null,
  children,
  disableInsteadOfHide = false,
  tooltip,
}) => {
  const { hasPermission, hasRole } = usePermissions();

  const isAuthorized = permission
    ? hasPermission(permission)
    : role
      ? hasRole(role)
      : true;

  const unauthorizedMessage =
    tooltip ??
    (permission
      ? "Requires permission: " + permission
      : role
        ? "Requires role: " + (Array.isArray(role) ? role.join(" or ") : role)
        : "Access denied");

  if (!isAuthorized) {
    if (disableInsteadOfHide) {
      return (
        <div
          title={unauthorizedMessage}
          style={{ opacity: 0.5, pointerEvents: "none" }}
        >
          {children}
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
