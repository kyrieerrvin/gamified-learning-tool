// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This is a simplified version without actual token validation
  // In a real app, you would verify the session token
  const token = request.cookies.get('session');
  
  // Only redirect for protected routes
  if (!token && (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/challenges')
  )) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/challenges/:path*',
    '/login-success'
  ],
};