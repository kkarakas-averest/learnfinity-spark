import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log API request details for debugging
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`[MIDDLEWARE DEBUG] API Request received:`, {
      path: request.nextUrl.pathname,
      method: request.method,
      hasAuth: !!request.headers.get('authorization'),
      hasCookies: !!request.headers.get('cookie'),
    });
  }
  
  return NextResponse.next();
}

// Optionally configure middleware to only run on API routes
export const config = {
  matcher: ['/api/:path*'],
}; 