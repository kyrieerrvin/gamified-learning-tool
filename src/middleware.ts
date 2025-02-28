// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Just log for debugging and let all requests through for now
  console.log("Middleware running for:", request.nextUrl.pathname);
  
  // Temporarily disable all redirections to debug the route issue
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/challenges/:path*'
  ],
};