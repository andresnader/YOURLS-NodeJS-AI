import { nanoid } from 'nanoid';
import prisma from '@/lib/prisma';
import { isBlacklisted } from '@/lib/blacklist';
import { fetchMetadata } from '@/lib/metadata';
import type { ShortenRequest } from '@/lib/schemas';
import type { SessionPayload } from '@/lib/session';

export const RESERVED_KEYWORDS = new Set([
  'admin', 'api', 'login', 'stats', 'protected', 'auth', 'export',
  'dashboard', 'config', 'settings', 'public', 'css', 'js', 'images', 'favicon.ico',
]);

export type ShortenError =
  | { type: 'blacklisted' }
  | { type: 'reserved' }
  | { type: 'invalid_keyword' }
  | { type: 'conflict'; keyword: string };

export type ShortenSuccess = {
  keyword: string;
  url: string;
  title: string | null;
  favicon: string | null;
  redirectType: number;
  createdAt: Date;
  clicks: number;
};

export function sanitizeKeyword(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

export async function shortenUrl(
  input: ShortenRequest,
  session: SessionPayload | null,
  ipAddress: string,
): Promise<{ ok: true; data: ShortenSuccess } | { ok: false; error: ShortenError }> {
  if (isBlacklisted(input.url)) {
    return { ok: false, error: { type: 'blacklisted' } };
  }

  const requestedKeyword = input.customKeyword ?? input.keyword;
  const keyword = requestedKeyword
    ? sanitizeKeyword(requestedKeyword)
    : nanoid(6);

  if (!keyword) {
    return { ok: false, error: { type: 'invalid_keyword' } };
  }
  if (RESERVED_KEYWORDS.has(keyword)) {
    return { ok: false, error: { type: 'reserved' } };
  }

  const existing = await prisma.url.findUnique({ where: { keyword } });
  if (existing) {
    return { ok: false, error: { type: 'conflict', keyword } };
  }

  let title: string | null = input.title?.trim() || null;
  let favicon: string | null = null;
  try {
    const meta = await fetchMetadata(input.url);
    title = title || meta.title;
    favicon = meta.favicon;
  } catch (e) {
    console.error('[shorten] metadata fetch failed:', e instanceof Error ? e.message : e);
  }

  const created = await prisma.url.create({
    data: {
      keyword,
      url: input.url,
      title,
      favicon,
      redirectType: input.redirectType ?? 302,
      userId: session?.id || null,
      ip: ipAddress,
    },
  });

  return {
    ok: true,
    data: {
      keyword: created.keyword,
      url: created.url,
      title: created.title,
      favicon: created.favicon,
      redirectType: created.redirectType,
      createdAt: created.createdAt,
      clicks: created.clicks,
    },
  };
}
