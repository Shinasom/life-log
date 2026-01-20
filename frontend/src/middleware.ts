import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 👇 1. DEFINE PUBLIC PATHS
  // We must explicitly list '/signup' here so the app doesn't kick you out.
  const isPublicPath = path === '/login' || path === '/signup';

  // 👇 2. GET TOKEN
  // We check for the cookie named 'accessToken' (matches your useLogin logic)
  const token = request.cookies.get('accessToken')?.value || '';

  // 👇 3. REDIRECT LOGIC
  
  // Case A: User is logged in, but tries to go to Login or Signup
  // Action: Redirect them to the Dashboard (Home)
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  // Case B: User is NOT logged in, but tries to go to a Protected Page
  // Action: Redirect them to Login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }
  
  // Case C: User is on a public page and not logged in (e.g. Signup)
  // Action: Do nothing, let them view the page.
}

// 👇 4. MATCHER CONFIG
// This tells Next.js which routes to run this middleware on.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};