import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { UpdateLinkRequest } from '@/lib/schemas';
import { RESERVED_KEYWORDS, sanitizeKeyword } from '@/lib/shorten';
import { isBlacklisted } from '@/lib/blacklist';

/**
 * Loads the link if it exists AND the caller is allowed to touch it.
 * ADMIN may act on any link; a regular user only on their own. Returns
 * `null` when the link is missing or owned by someone else (we collapse
 * both into 404 to avoid leaking existence of links the caller can't see).
 */
async function authorize(keyword: string) {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const entry = await prisma.url.findUnique({ where: { keyword } });
  if (!entry) return { error: NextResponse.json({ error: 'URL not found' }, { status: 404 }) };

  if (session.role !== 'ADMIN' && entry.userId !== session.id) {
    return { error: NextResponse.json({ error: 'URL not found' }, { status: 404 }) };
  }
  return { session, entry };
}

// GET — Get single URL details (never leak the password hash)
export async function GET(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const { keyword } = await context.params;
  try {
    const auth = await authorize(keyword);
    if (auth.error) return auth.error;

    const urlEntry = await prisma.url.findUnique({
      where: { keyword },
      include: { logs: { orderBy: { clickedAt: 'desc' }, take: 10 } },
    });
    if (!urlEntry) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    const { password, ...rest } = urlEntry;
    return NextResponse.json({ data: { ...rest, hasPassword: Boolean(password) } });
  } catch (error) {
    console.error('[GET link]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH — Update destination, title, redirect type, password and/or keyword
export async function PATCH(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const { keyword } = await context.params;
  try {
    const auth = await authorize(keyword);
    if (auth.error) return auth.error;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = UpdateLinkRequest.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 },
      );
    }
    const body = parsed.data;

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Build the column updates (everything except the keyword rename).
    const data: {
      url?: string;
      title?: string | null;
      redirectType?: number;
      password?: string | null;
    } = {};

    if (body.url !== undefined) {
      if (isBlacklisted(body.url)) {
        return NextResponse.json({ error: 'This domain is blacklisted' }, { status: 403 });
      }
      data.url = body.url;
    }

    if (body.title !== undefined) {
      data.title = body.title ? body.title.trim() : null;
    }

    if (body.redirectType !== undefined) {
      data.redirectType = body.redirectType;
    }

    if (body.password !== undefined) {
      // Empty string / null clears protection; otherwise store a bcrypt hash.
      data.password = body.password ? await bcrypt.hash(body.password, 10) : null;
    }

    // Resolve the (optional) keyword rename.
    let targetKeyword = keyword;
    if (body.keyword !== undefined) {
      const next = sanitizeKeyword(body.keyword);
      if (!next) {
        return NextResponse.json({ error: 'Invalid keyword' }, { status: 400 });
      }
      if (RESERVED_KEYWORDS.has(next)) {
        return NextResponse.json({ error: 'Keyword is reserved for system use' }, { status: 400 });
      }
      if (next !== keyword) {
        const clash = await prisma.url.findUnique({ where: { keyword: next } });
        if (clash) {
          return NextResponse.json({ error: 'Keyword already in use' }, { status: 409 });
        }
        targetKeyword = next;
      }
    }

    // No rename: a plain update is enough.
    if (targetKeyword === keyword) {
      if (Object.keys(data).length === 0) {
        // Only a no-op keyword was sent.
        const current = await prisma.url.findUnique({ where: { keyword } });
        return NextResponse.json({ success: true, data: stripPassword(current) });
      }
      const updated = await prisma.url.update({ where: { keyword }, data });
      return NextResponse.json({ success: true, data: stripPassword(updated) });
    }

    // Rename: copy the row to the new keyword, migrate logs, drop the old row.
    // Done in a transaction so click history is never lost or duplicated.
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

    return NextResponse.json({ success: true, data: stripPassword(updated) });
  } catch (error) {
    console.error('[PATCH link]', error);
    return NextResponse.json({ error: 'Error updating URL' }, { status: 500 });
  }
}

// DELETE — Delete a single URL
export async function DELETE(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const { keyword } = await context.params;
  try {
    const auth = await authorize(keyword);
    if (auth.error) return auth.error;

    await prisma.url.delete({ where: { keyword } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE link]', error);
    return NextResponse.json({ error: 'Error deleting URL' }, { status: 500 });
  }
}

function stripPassword<T extends { password?: string | null }>(entry: T | null) {
  if (!entry) return null;
  const { password, ...rest } = entry;
  return { ...rest, hasPassword: Boolean(password) };
}
