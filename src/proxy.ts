import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';
import prisma from './lib/prisma';

const limiter = rateLimit({
  id: 'api-public-shorten',
  limit: 10, // 10 requests
  windowMs: 60 * 1000 // per 1 minute
});

function isValidSession(sessionValue: string | undefined): boolean {
  if (!sessionValue) return false;
  try {
    const session = JSON.parse(sessionValue);
    return !!(session.id && session.username);
  } catch {
    return false;
  }
}

async function isValidApiKey(apiKey: string | null): Promise<boolean> {
  if (!apiKey) return false;
  const keyData = await prisma.apiKey.findUnique({
    where: { key: apiKey, isActive: true }
  });
  return !!keyData;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('yourls_session');
  const isAuthenticated = isValidSession(sessionCookie?.value);

  // Check for API Key in headers
  const apiKey = request.headers.get('x-api-key');
  const hasValidApiKey = await isValidApiKey(apiKey);

  // 1. Rate Limiting for Public Shorten API
  if (pathname === '/api/shorten' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
    const { success, remaining, reset } = limiter.check(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'System busy. Level 429: Rate limit exceeded.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }
  }

  // 2. Auth Protection for Admin Routes - use client-side check via localStorage
  // The proxy only checks if there's ANY session, real validation is done client-side
  // This allows localStorage-based auth to work

  // 3. Auth Protection for sensitive API routes
  // Allow POST to /api/shorten (Public usage) and /api/auth (Login/Logout)
  // Also allow API Key authentication for programmatic access
  const isPublicApi =
    (pathname === '/api/shorten' && request.method === 'POST') ||
    (pathname === '/api/auth' && (request.method === 'POST' || request.method === 'DELETE'));

  // Routes that allow API Key authentication (for WordPress integration, etc.)
  const apiKeyAllowedRoutes = [
    '/api/shorten',
    '/api/stats',
  ];
  const isApiKeyRoute = apiKeyAllowedRoutes.some(route => pathname.startsWith(route));

  if (pathname.startsWith('/api') && !isPublicApi) {
    if (!isAuthenticated && !(hasValidApiKey && isApiKeyRoute)) {
      return NextResponse.json({ error: 'Authentication required for network protocol access.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
