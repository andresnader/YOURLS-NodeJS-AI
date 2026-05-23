import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';
import { lookupApiKey } from './lib/api-key';
import { SESSION_COOKIE, verifySession, type SessionPayload } from './lib/session';

function problemJson(status: number, code: string, detail: string, extraHeaders: Record<string, string> = {}) {
  const body = {
    type: `/errors/${code}`,
    title: code.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    status,
    code,
    detail,
  };
  return NextResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/problem+json', ...extraHeaders },
  });
}

const shortenLimiter = rateLimit({
  id: 'api-public-shorten',
  limit: 10,
  windowMs: 60 * 1000,
});

const apiLimiter = rateLimit({
  id: 'api-authenticated',
  limit: 120,
  windowMs: 60 * 1000,
});

const PUBLIC_API_ROUTES: Array<{ path: string; methods: string[] }> = [
  { path: '/api/auth', methods: ['POST', 'DELETE'] },
  { path: '/api/shorten', methods: ['POST'] },
  { path: '/api/v1/shorten', methods: ['POST'] },
  { path: '/api/openapi.json', methods: ['GET'] },
  { path: '/api/v1/openapi.json', methods: ['GET'] },
  { path: '/api/docs', methods: ['GET'] },
];

// Path prefixes that are public for GET only (consumed by <img>/<a> tags
// from a browser, which cannot send an API key).
const PUBLIC_API_PREFIXES_GET: string[] = [
  '/api/qr/',
];

const API_KEY_ALLOWED_ROUTES = [
  '/api/shorten',
  '/api/stats',
  '/api/test',
  '/api/links',
  '/api/v1/shorten',
  '/api/v1/stats',
  '/api/v1/test',
  '/api/v1/links',
];

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

function isPublicApi(pathname: string, method: string): boolean {
  if (PUBLIC_API_ROUTES.some(r => pathname === r.path && r.methods.includes(method))) {
    return true;
  }
  if (method === 'GET' && PUBLIC_API_PREFIXES_GET.some(p => pathname.startsWith(p))) {
    return true;
  }
  return false;
}

function isApiKeyRoute(pathname: string): boolean {
  return API_KEY_ALLOWED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Public shorten: rate limit only
  if (pathname === '/api/shorten' && method === 'POST') {
    const { success, remaining, reset } = shortenLimiter.check(getIp(request));
    if (!success) {
      return problemJson(429, 'rate_limited', 'Rate limit exceeded', {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      });
    }
  }

  // Determine session
  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  const cookieSession: SessionPayload | null = verifySession(cookieToken);

  const apiKey = request.headers.get('x-api-key');
  const apiKeyData = apiKey ? await lookupApiKey(apiKey) : null;


  const isAuthenticated = !!cookieSession || !!apiKeyData;

  // /admin/* → require cookie session (no API key for browser UI)
  if (pathname.startsWith('/admin')) {
    if (!cookieSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // /api/* → require auth (cookie or API key), except whitelisted public endpoints
  if (pathname.startsWith('/api') && !isPublicApi(pathname, method)) {
    if (!isAuthenticated) {
      return problemJson(401, 'unauthenticated', 'Authentication required');
    }
    if (apiKeyData && !cookieSession && !isApiKeyRoute(pathname)) {
      return problemJson(403, 'forbidden', 'API key not permitted for this route');
    }
    const limitKey = cookieSession?.id || apiKeyData?.userId || getIp(request);
    const { success, remaining, reset } = apiLimiter.check(`api:${limitKey}`);
    if (!success) {
      return problemJson(429, 'rate_limited', 'Rate limit exceeded', {
        'X-RateLimit-Limit': '120',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
