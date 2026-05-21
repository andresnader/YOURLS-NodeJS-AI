import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { generateApiKey } from '@/lib/api-key';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    console.error('Error fetching keys:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, expiresInDays } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { raw, hash, prefix } = generateApiKey();

    const expiresAt =
      typeof expiresInDays === 'number' && expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

    const newKey = await prisma.apiKey.create({
      data: {
        keyHash: hash,
        keyPrefix: prefix,
        name,
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

    // The raw key is returned exactly once. Client must store it; server cannot recover it later.
    return NextResponse.json({ success: true, data: { ...newKey, key: raw } });
  } catch (error) {
    console.error('Error creating key:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

    if (session.role !== 'ADMIN' && key.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.apiKey.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
