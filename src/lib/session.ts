import { cookies, headers } from 'next/headers';
import crypto from 'crypto';
import { lookupApiKey } from '@/lib/api-key';

export const SESSION_COOKIE = 'yourls_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  exp: number;
  isApiKey?: boolean;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is required in production');
    }
    return 'dev-only-insecure-secret-change-me';
  }
  return secret;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

export function signSession(payload: Omit<SessionPayload, 'exp'>, ttlSeconds = SESSION_MAX_AGE_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = JSON.stringify({ ...payload, exp });
  const bodyB64 = b64url(Buffer.from(body, 'utf8'));
  const sig = crypto.createHmac('sha256', getSecret()).update(bodyB64).digest();
  return `${bodyB64}.${b64url(sig)}`;
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [bodyB64, sigB64] = parts;

  const expectedSig = crypto.createHmac('sha256', getSecret()).update(bodyB64).digest();
  const givenSig = b64urlDecode(sigB64);
  if (expectedSig.length !== givenSig.length || !crypto.timingSafeEqual(expectedSig, givenSig)) {
    return null;
  }

  try {
    const payload = JSON.parse(b64urlDecode(bodyB64).toString('utf8')) as SessionPayload;
    if (!payload.id || !payload.username || !payload.role || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    // 1. API Key (validated by hash against DB)
    const headerList = await headers();
    const apiKey = headerList.get('x-api-key');
    if (apiKey) {
      const auth = await lookupApiKey(apiKey);
      if (!auth) return null;
      return {
        id: auth.userId,
        username: auth.username,
        role: auth.role,
        exp: Math.floor(Date.now() / 1000) + 60,
        isApiKey: true,
      };
    }

    // 2. Signed cookie session
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    return verifySession(token);
  } catch (e) {
    console.error('[getSession] error:', e);
    return null;
  }
}
