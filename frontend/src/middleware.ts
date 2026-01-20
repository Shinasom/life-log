import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 👇 This MUST be named 'middleware' and exported
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;
  const isPublicRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/auth');

  // Case 1: No Token + Protected Route -> Redirect to Login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Case 2: Has Token + Public Route -> Redirect to Today
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/today', request.url)); // 👈 CHANGED TO /today
  }

  return NextResponse.next();
}

// Configuration to ignore static files
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};