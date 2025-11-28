'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth-store';
import { Loader2, ShieldAlert } from 'lucide-react';
import { AuthErrorBoundary } from './AuthErrorBoundary';

interface AuthGuardProps {
  children: React.ReactNode;
  /**
   * List of public paths that don't require authentication
   * @default ['/auth/signin', '/auth/signup', '/auth/error', '/auth/verify-request']
   */
  publicPaths?: string[];
  /**
   * Path to redirect to when user is not authenticated
   * @default '/auth/signin'
   */
  loginPath?: string;
  /**
   * Custom loading component to show while checking authentication
   */
  loadingComponent?: React.ReactNode;
  /**
   * Custom error component to show when an error occurs
   */
  errorComponent?: React.ReactNode;
}

/**
 * AuthGuard component that protects routes and handles authentication state
 * Wraps the application in an error boundary and handles redirection
 */
export function AuthGuard({
  children,
  publicPaths = [
    '/auth/signin',
    '/auth/signup',
    '/auth/error',
    '/auth/verify-request',
  ],
  loginPath = '/auth/signin',
  loadingComponent,
  errorComponent,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Get auth state from the store
  const { isAuthenticated, checkAuth, isLoading: isAuthLoading } = useAuthStore();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await checkAuth();
      } catch (err) {
        console.error('Auth check failed:', err);
        setError(err instanceof Error ? err : new Error('Authentication check failed'));
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [checkAuth]);

  useEffect(() => {
    // Only redirect if we're not already on a public path
    const isPublicPath = publicPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );

    if (!isLoading && !isAuthLoading && !isAuthenticated && !isPublicPath) {
      // Store the current path to redirect back after login
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`${loginPath}?callbackUrl=${callbackUrl}`);
    }
  }, [isAuthenticated, isLoading, isAuthLoading, pathname, publicPaths, loginPath, router]);

  // Show loading state
  if (isLoading || isAuthLoading) {
    return loadingComponent || (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return errorComponent || (
      <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 p-4 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Authentication Error</h2>
        <p className="text-muted-foreground">
          {error.message || 'An error occurred while checking your authentication status.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  // For public paths, just render the children without auth check
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    return <>{children}</>;
  }

  // For protected routes, check authentication
  if (!isAuthenticated) {
    // Show a brief loading state before redirecting
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Wrap the children with error boundary
  return (
    <AuthErrorBoundary>
      {children}
    </AuthErrorBoundary>
  );
}

/**
 * Higher Order Component for protecting routes with AuthGuard
 */
export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function WithAuthGuard(props: P) {
    return (
      <AuthGuard {...options}>
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };
}
