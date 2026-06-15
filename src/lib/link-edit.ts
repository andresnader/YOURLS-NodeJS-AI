/**
 * Shared mutation logic for a single short link: ownership-checked update
 * (including keyword rename that preserves click history) and delete.
 *
 * Used by both the REST route (/api/shorten/[keyword]) and the MCP tools so
 * there is a single source of truth for the rules. Callers pass an already
 * resolved session; both entry points authenticate before calling in.
 */
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import type { SessionPayload } from '@/lib/session';
import type { UpdateLinkRequest } from '@/lib/schemas';
import { RESERVED_KEYWORDS, sanitizeKeyword } from '@/lib/shorten';
import { isBlacklisted } from '@/lib/blacklist';

export type LinkMutationError =
  | 'not_found'
  | 'no_fields'
  | 'blacklisted'
  | 'invalid_keyword'
  | 'reserved'
  | 'conflict';

export type SanitizedLink = {
  keyword: string;
  url: string;
  title: string | null;
  redirectType: number;
  favicon: string | null;
  isHealthy: boolean;
  clicks: number;
  createdAt: Date;
  userId: string | null;
  hasPassword: boolean;
};

export function stripPassword<T extends { password?: string | null }>(
  entry: T | null,
): (Omit<T, 'password'> & { hasPassword: boolean }) | null {
  if (!entry) return null;
  const { password, ...rest } = entry;
  return { ...rest, hasPassword: Boolean(password) };
}

/**
 * Returns the link only if it exists AND the caller may act on it (admins on
 * any link, regular users only on their own). `null` collapses "missing" and
 * "forbidden" so callers never leak the existence of links they can't see.
 */
export async function getOwnedLink(keyword: string, session: SessionPayload) {
  const entry = await prisma.url.findUnique({ where: { keyword } });
  if (!entry) return null;
  if (session.role !== 'ADMIN' && entry.userId !== session.id) return null;
  return entry;
}

export async function updateLink(
  keyword: string,
  input: UpdateLinkRequest,
  session: SessionPayload,
): Promise<{ ok: true; data: SanitizedLink } | { ok: false; error: LinkMutationError }> {
  const entry = await getOwnedLink(keyword, session);
  if (!entry) return { ok: false, error: 'not_found' };

  if (Object.keys(input).length === 0) return { ok: false, error: 'no_fields' };

  const data: {
    url?: string;
    title?: string | null;
    redirectType?: number;
    password?: string | null;
  } = {};

  if (input.url !== undefined) {
    if (isBlacklisted(input.url)) return { ok: false, error: 'blacklisted' };
    data.url = input.url;
  }
  if (input.title !== undefined) data.title = input.title ? input.title.trim() : null;
  if (input.redirectType !== undefined) data.redirectType = input.redirectType;
  if (input.password !== undefined) {
    // Empty string / null clears protection; otherwise store a bcrypt hash.
    data.password = input.password ? await bcrypt.hash(input.password, 10) : null;
  }

  // Resolve the (optional) keyword rename.
  let targetKeyword = keyword;
  if (input.keyword !== undefined) {
    const next = sanitizeKeyword(input.keyword);
    if (!next) return { ok: false, error: 'invalid_keyword' };
    if (RESERVED_KEYWORDS.has(next)) return { ok: false, error: 'reserved' };
    if (next !== keyword) {
      const clash = await prisma.url.findUnique({ where: { keyword: next } });
      if (clash) return { ok: false, error: 'conflict' };
      targetKeyword = next;
    }
  }

  // No rename: a plain column update is enough.
  if (targetKeyword === keyword) {
    if (Object.keys(data).length === 0) {
      const current = await prisma.url.findUnique({ where: { keyword } });
      return { ok: true, data: stripPassword(current)! };
    }
    const updated = await prisma.url.update({ where: { keyword }, data });
    return { ok: true, data: stripPassword(updated)! };
  }

  // Rename: copy the row to the new keyword, migrate logs, drop the old row,
  // all in one transaction so click history is never lost or duplicated.
  const updated = await prisma.$transaction(async (tx) => {
    const old = await tx.url.findUniqueOrThrow({ where: { keyword } });
    const created = await tx.url.create({
      data: {
        keyword: targetKeyword,
        url: data.url ?? old.url,
        title: data.title !== undefined ? data.title : old.title,
        createdAt: old.createdAt,
        ip: old.ip,
        clicks: old.clicks,
        password: data.password !== undefined ? data.password : old.password,
        redirectType: data.redirectType ?? old.redirectType,
        favicon: old.favicon,
        isHealthy: old.isHealthy,
        userId: old.userId,
      },
    });
    await tx.log.updateMany({
      where: { shorturl: keyword },
      data: { shorturl: targetKeyword },
    });
    await tx.url.delete({ where: { keyword } });
    return created;
  });

  return { ok: true, data: stripPassword(updated)! };
}

export async function deleteLink(
  keyword: string,
  session: SessionPayload,
): Promise<{ ok: true } | { ok: false; error: LinkMutationError }> {
  const entry = await getOwnedLink(keyword, session);
  if (!entry) return { ok: false, error: 'not_found' };
  await prisma.url.delete({ where: { keyword } });
  return { ok: true };
}
