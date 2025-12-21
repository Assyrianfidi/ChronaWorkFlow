import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Role = "USER" | "ADMIN";

// Define public routes that don't require authentication
const publicRoutes = ["/auth/signin", "/auth/error", "/_next", "/api/auth"];

// Define admin routes that require admin role
const adminRoutes = ["/admin"];

// Check if the current path matches any of the protected routes
const isProtectedRoute = (pathname: string, routes: string[]): boolean => {
  return routes.some((route) => pathname.startsWith(route));
};

export async function middleware(request: NextRequest) {
  return NextResponse.next();
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
    "/((?!api|_next/static|_next/image|favicon.ico|auth/|public/).*)",
  ],
};
