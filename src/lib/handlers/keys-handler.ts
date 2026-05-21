import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { generateApiKey } from '@/lib/api-key';
import { CreateApiKeyRequest } from '@/lib/schemas';
import { z } from 'zod';
import { badRequest, forbidden, fromZod, notFound, serverError, unauthorized } from '@/lib/api-error';

const DeleteRequest = z.object({ id: z.string().min(1) });

export async function keysGet(): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const keys = await prisma.apiKey.findMany({
      where: session.role === 'ADMIN' ? {} : { userId: session.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        expiresAt: true,
        lastUsed: true,
        isActive: true,
        userId: true,
      },
    });

    return NextResponse.json({ success: true, data: keys });
  } catch (error) {
    console.error('[keysGet]', error);
    return serverError();
  }
}

export async function keysPost(request: Request): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const rawBody = await request.text();
    let json: unknown;
    try {
      json = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return badRequest('Invalid JSON body');
    }

    const parsed = CreateApiKeyRequest.safeParse(json);
    if (!parsed.success) return fromZod(parsed.error);

    const { raw, hash, prefix } = generateApiKey();
    const expiresAt = parsed.data.expiresInDays
      ? new Date(Date.now() + parsed.data.expiresInDays * 86_400_000)
      : null;

    const created = await prisma.apiKey.create({
      data: {
        keyHash: hash,
        keyPrefix: prefix,
        name: parsed.data.name,
        userId: session.id,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        expiresAt: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: { ...created, key: raw } });
  } catch (error) {
    console.error('[keysPost]', error);
    return serverError(error instanceof Error ? error.message : undefined);
  }
}

export async function keysDelete(request: Request): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const rawBody = await request.text();
    let json: unknown;
    try {
      json = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return badRequest('Invalid JSON body');
    }

    const parsed = DeleteRequest.safeParse(json);
    if (!parsed.success) return fromZod(parsed.error);

    const key = await prisma.apiKey.findUnique({ where: { id: parsed.data.id } });
    if (!key) return notFound('Key not found');

    if (session.role !== 'ADMIN' && key.userId !== session.id) {
      return forbidden();
    }

    await prisma.apiKey.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[keysDelete]', error);
    return serverError();
  }
}
