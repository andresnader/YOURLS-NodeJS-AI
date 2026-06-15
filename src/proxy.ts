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

/** Authenticated bucket — sized to support batch migrations from the WP
 *  plugin (50 posts/batch, run sequentially) without hitting the cap. */
const apiLimiter = rateLimit({
  id: 'api-authenticated',
  limit: 600,
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
  '/api/mcp',
  '/api/v1/shorten',
  '/api/v1/stats',
  '/api/v1/test',
  '/api/v1/links',
];

/** API key from the x-api-key header or an Authorization: Bearer header. */
function extractApiKey(request: NextRequest): string | null {
  const direct = request.headers.get('x-api-key');
  if (direct) return direct.trim();
  const auth = request.headers.get('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return null;
}

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

  // Determine session first so rate-limiting can pick the right bucket.
  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  const cookieSession: SessionPayload | null = verifySession(cookieToken);

  const apiKey = extractApiKey(request);
  const apiKeyData = apiKey ? await lookupApiKey(apiKey) : null;

  const isAuthenticated = !!cookieSession || !!apiKeyData;

  // Public shorten endpoint: anonymous IPs get the strict 10/min limit;
  // authenticated callers (API key or cookie) fall through to the standard
  // 120/min user bucket below, so the WP plugin can migrate large batches.
  if (pathname === '/api/shorten' && method === 'POST' && !isAuthenticated) {
    const { success, remaining, reset } = shortenLimiter.check(getIp(request));
    if (!success) {
      return problemJson(429, 'rate_limited', 'Rate limit exceeded', {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      });
    }
  }

  // /admin/* → require cookie session (no API key for browser UI)
  if (pathname.startsWith('/admin')) {
    if (!cookieSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  // /api/* — authenticated bucket. Public routes still need a limit; we run
  // the user/IP bucket here so authenticated callers on /api/shorten also
  // get a sensible 120/min cap instead of the anonymous 10/min.
  if (pathname.startsWith('/api')) {
    const isPublic = isPublicApi(pathname, method);

    if (!isPublic) {
      if (!isAuthenticated) {
        return problemJson(401, 'unauthenticated', 'Authentication required');
      }
      if (apiKeyData && !cookieSession && !isApiKeyRoute(pathname)) {
        return problemJson(403, 'forbidden', 'API key not permitted for this route');
      }
    }

    if (isAuthenticated || !isPublic) {
      const limitKey = cookieSession?.id || apiKeyData?.userId || getIp(request);
      const { success, remaining, reset } = apiLimiter.check(`api:${limitKey}`);
      if (!success) {
        return problemJson(429, 'rate_limited', 'Rate limit exceeded', {
          'X-RateLimit-Limit': '600',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
