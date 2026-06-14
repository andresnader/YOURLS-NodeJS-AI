/**
 * Shared HTTP handlers for /api/shorten and /api/v1/shorten.
 * The /api/* routes are deprecated aliases to /api/v1/*.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { shortenUrl } from '@/lib/shorten';
import {
  ShortenRequest,
  ListLinksQuery,
  BulkDeleteRequest,
} from '@/lib/schemas';
import { badRequest, fromZod, problem, serverError } from '@/lib/api-error';
import { idempotencyKey, getCached, setCached } from '@/lib/idempotency';

function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function shortenPost(request: Request): Promise<Response> {
  try {
    const session = await getSession();

    const rawBody = await request.text();
    let json: unknown;
    try {
      json = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return badRequest('Invalid JSON body');
    }

    const parsed = ShortenRequest.safeParse(json);
    if (!parsed.success) return fromZod(parsed.error);

    const ip = clientIp(request);
    const principal = session?.id || `ip:${ip}`;
    const idKey = idempotencyKey(principal, request.headers.get('idempotency-key'));

    if (idKey) {
      const cached = getCached(idKey);
      if (cached) {
        return NextResponse.json(cached.body, {
          status: cached.status,
          headers: { 'Idempotent-Replay': 'true' },
        });
      }
    }

    const result = await shortenUrl(parsed.data, session, ip);

    if (!result.ok) {
      switch (result.error.type) {
        case 'blacklisted':
          return problem(403, 'blacklisted', 'This domain is blacklisted');
        case 'reserved':
          return problem(400, 'reserved_keyword', 'Keyword is reserved for system use');
        case 'invalid_keyword':
          return badRequest('Invalid keyword after sanitization');
        case 'conflict':
          return problem(409, 'conflict', 'Keyword already in use', { instance: result.error.keyword });
      }
    }

    const body = { success: true as const, data: result.data };
    if (idKey) setCached(idKey, 200, body);
    return NextResponse.json(body);
  } catch (error) {
    console.error('[shortenPost]', error);
    return serverError(error instanceof Error ? error.message : 'Unknown error');
  }
}

export async function shortenGetList(request: Request): Promise<Response> {
  try {
    const session = await getSession();
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams);
    const parsed = ListLinksQuery.safeParse(query);
    if (!parsed.success) return fromZod(parsed.error);

    const { page, limit, search, sortBy, sortOrder } = parsed.data;

    const where: Record<string, unknown> = {};
    if (session && session.role !== 'ADMIN') where.userId = session.id;

    if (search) {
      where.OR = [
        { keyword: { contains: search, mode: 'insensitive' } },
        { url: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [urls, total] = await Promise.all([
      prisma.url.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.url.count({ where }),
    ]);

    // Never ship the password hash to clients; expose only whether one is set.
    const sanitized = urls.map(({ password, ...rest }) => ({
      ...rest,
      hasPassword: Boolean(password),
    }));

    return NextResponse.json({
      data: sanitized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[shortenGetList]', error);
    return serverError();
  }
}

export async function shortenDelete(request: Request): Promise<Response> {
  try {
    const session = await getSession();
    const rawBody = await request.text();
    let json: unknown;
    try {
      json = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return badRequest('Invalid JSON body');
    }

    const parsed = BulkDeleteRequest.safeParse(json);
    if (!parsed.success) return fromZod(parsed.error);

    const where: Record<string, unknown> = { keyword: { in: parsed.data.keywords } };
    if (session && session.role !== 'ADMIN') where.userId = session.id;

    const result = await prisma.url.deleteMany({ where });
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error('[shortenDelete]', error);
    return serverError();
  }
}
