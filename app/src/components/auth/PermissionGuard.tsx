'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';
import { Shield, Loader2 } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: 'owner' | 'admin' | 'manager' | 'accountant' | 'viewer';
  fallback?: React.ReactNode;
}

/**
 * Permission Guard Component
 * 
 * Protects routes and components based on user permissions and roles.
 * Supports requiring specific permissions or minimum role level.
 */
export function PermissionGuard({
  children,
  requiredPermissions = [],
  requiredRole,
  fallback,
}: PermissionGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, [user, isAuthenticated, requiredPermissions, requiredRole]);

  const checkPermissions = () => {
    setIsChecking(true);

    // Wait for auth to load
    if (isLoading) {
      setIsChecking(false);
      return;
    }

    // Must be authenticated
    if (!isAuthenticated || !user) {
      setHasPermission(false);
      setIsChecking(false);
      router.push('/login');
      return;
    }

    // Check role requirement
    if (requiredRole) {
      const roleHierarchy = ['viewer', 'staff', 'inventory_manager', 'accountant', 'auditor', 'manager', 'admin', 'owner'];
      const userRoleIndex = roleHierarchy.indexOf(user.role.toLowerCase());
      const requiredRoleIndex = roleHierarchy.indexOf(requiredRole.toLowerCase());

      if (userRoleIndex < requiredRoleIndex) {
        setHasPermission(false);
        setIsChecking(false);
        toast.error(`This action requires ${requiredRole} role or higher`);
        return;
      }
    }

    // Check specific permissions
    if (requiredPermissions.length > 0) {
      const userPermissions = getUserPermissions(user.role);
      const hasAllPermissions = requiredPermissions.every(p => 
        userPermissions.includes(p) || userPermissions.includes('*')
      );

      if (!hasAllPermissions) {
        setHasPermission(false);
        setIsChecking(false);
        toast.error('You do not have permission to access this resource');
        return;
      }
    }

    setHasPermission(true);
    setIsChecking(false);
  };

  const getUserPermissions = (role: string): string[] => {
    const permissions: Record<string, string[]> = {
      owner: ['*'],
      admin: [
        'read:*',
        'write:*',
        'read:dashboard',
        'write:dashboard',
        'read:invoices',
        'write:invoices',
        'read:users',
        'write:users',
        'read:reports',
        'write:reports',
        'read:billing',
        'write:billing',
        'read:settings',
        'write:settings',
        'manage:api-keys',
      ],
      MANAGER: [
        'read:dashboard',
        'write:dashboard',
        'read:invoices',
        'write:invoices',
        'read:reports',
        'write:reports',
        'read:team',
        'write:team',
        'read:settings',
      ],
      ACCOUNTANT: [
        'read:dashboard',
        'write:dashboard',
        'read:invoices',
        'write:invoices',
        'read:reports',
        'write:reports',
        'read:transactions',
        'write:transactions',
        'read:accounts',
        'write:accounts',
        'read:journal',
        'write:journal',
      ],
      VIEWER: [
        'read:dashboard',
        'read:invoices',
        'read:reports',
        'read:accounts',
      ],
    };

    return permissions[role] || [];
  };

  if (isChecking || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You do not have permission to access this resource. 
          Please contact your administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Role-specific guard components for convenience
 */
export function OwnerGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard requiredRole="owner" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function AdminGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard requiredRole="admin" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function ManagerGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard requiredRole="manager" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function AccountantGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <PermissionGuard requiredRole="accountant" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Hook to check permissions in components
 */
export function usePermissions() {
  const { user } = useAuthStore();

  const hasRole = (minimumRole: string): boolean => {
    if (!user) return false;
    
    const hierarchy = ['viewer', 'accountant', 'manager', 'admin', 'owner'];
    const userIndex = hierarchy.indexOf(user.role);
    const requiredIndex = hierarchy.indexOf(minimumRole);
    
    return userIndex >= requiredIndex;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    
    const permissions: Record<string, string[]> = {
      admin: ['read:*', 'write:*', 'manage:api-keys'],
      manager: ['read:dashboard', 'write:dashboard', 'read:invoices', 'write:invoices'],
      accountant: ['read:dashboard', 'read:invoices', 'write:invoices', 'read:accounts'],
      viewer: ['read:dashboard', 'read:invoices', 'read:reports'],
    };

    const userPerms = permissions[user.role] || [];
    return userPerms.includes('*') || userPerms.includes(permission);
  };

  const canRead = (resource: string): boolean => hasPermission(`read:${resource}`);
  const canWrite = (resource: string): boolean => hasPermission(`write:${resource}`);
  const canDelete = (resource: string): boolean => hasPermission(`delete:${resource}`);

  return {
    hasRole,
    hasPermission,
    canRead,
    canWrite,
    canDelete,
    role: user?.role,
    isOwner: user?.role === 'owner',
    isAdmin: user?.role === 'admin' || user?.role === 'owner',
  };
}

export default PermissionGuard;
