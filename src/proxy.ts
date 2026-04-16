import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Named export as required by Next.js 16 (proxy convention)
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect the /admin routes
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('yourls_session');

    if (!sessionCookie || sessionCookie.value !== 'authenticated') {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect API mutation routes (POST, PATCH, DELETE on /api/shorten, /api/export)
  if (pathname.startsWith('/api/shorten') || pathname.startsWith('/api/export') || pathname.startsWith('/api/stats')) {
    // Allow GET requests without auth (for public API reads if needed later)
    // For now, protect all methods
    const sessionCookie = request.cookies.get('yourls_session');
    if (!sessionCookie || sessionCookie.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/shorten/:path*', '/api/stats/:path*', '/api/export/:path*'],
};
