import crypto from 'crypto';
import prisma from '@/lib/prisma';

export const API_KEY_PREFIX = 'yn_';
export const API_KEY_PREFIX_DISPLAY_LEN = 11;

export type ApiKeyAuth = {
  id: string;
  userId: string;
  role: 'ADMIN' | 'USER';
  username: string;
};

export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = API_KEY_PREFIX + crypto.randomBytes(32).toString('hex');
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, API_KEY_PREFIX_DISPLAY_LEN),
  };
}

export async function lookupApiKey(rawKey: string): Promise<ApiKeyAuth | null> {
  if (!rawKey) return null;

  const hash = hashApiKey(rawKey);
  const now = new Date();

  // Primary: lookup by hash
  let keyData = await prisma.apiKey.findFirst({
    where: {
      keyHash: hash,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: { user: { select: { id: true, username: true, role: true } } },
  });

  // Fallback: legacy plaintext rows not yet backfilled
  if (!keyData) {
    keyData = await prisma.apiKey.findFirst({
      where: {
        key: rawKey,
        keyHash: null,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: { user: { select: { id: true, username: true, role: true } } },
    });
  }

  // Master key fallback
  if (!keyData) {
    const masterKey = process.env.API_KEY;
    if (masterKey && rawKey === masterKey) {
      return { id: 'system', userId: 'system', role: 'ADMIN', username: 'api_user' };
    }
    return null;
  }

  prisma.apiKey
    .update({ where: { id: keyData.id }, data: { lastUsed: now } })
    .catch(() => {});

  return {
    id: keyData.id,
    userId: keyData.user.id,
    username: keyData.user.username,
    role: keyData.user.role as 'ADMIN' | 'USER',
  };
}
