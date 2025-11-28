import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type Role = 'USER' | 'ADMIN';

// Define public routes that don't require authentication
const publicRoutes = ['/auth/signin', '/auth/error', '/_next', '/api/auth'];

// Define admin routes that require admin role
const adminRoutes = ['/admin'];

// Check if the current path matches any of the protected routes
const isProtectedRoute = (pathname: string, routes: string[]): boolean => {
  return routes.some(route => pathname.startsWith(route));
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Check admin routes
  if (isProtectedRoute(pathname, adminRoutes)) {
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Add user role to request headers for server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-role', token.role as string);
  requestHeaders.set('x-user-id', token.sub as string);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - auth/ (authentication pages)
    // - public/ (public files)
    '/((?!api|_next/static|_next/image|favicon.ico|auth/|public/).*)',
  ],
};
