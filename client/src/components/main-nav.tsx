'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';

export function MainNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link
        href="/"
        className={cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive('/') ? 'text-foreground' : 'text-foreground/60'
        )}
      >
        Home
      </Link>
      
      {status === 'authenticated' && (
        <Link
          href="/dashboard"
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            isActive('/dashboard') ? 'text-foreground' : 'text-foreground/60'
          )}
        >
          Dashboard
        </Link>
      )}

      {status === 'authenticated' && session.user.role === 'ADMIN' && (
        <Link
          href="/admin"
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            isActive('/admin') ? 'text-foreground' : 'text-foreground/60'
          )}
        >
          Admin
        </Link>
      )}
    </nav>
  );
}

export function AuthNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading') {
    return <div className="w-24"></div>;
  }

  return (
    <div className="flex items-center space-x-4">
      {status === 'authenticated' ? (
        <div className="flex items-center space-x-4">
          <Link
            href="/profile"
            className={cn(
              'text-sm font-medium transition-colors hover:text-primary',
              pathname === '/profile' ? 'text-foreground' : 'text-foreground/60'
            )}
          >
            Profile
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors"
            >
              Sign out
            </button>
          </form>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
            {session.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      ) : (
        <>
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname || '/')}`}
            className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign up
          </Link>
        </>
      )}
    </div>
  );
}
