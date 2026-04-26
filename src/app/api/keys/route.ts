import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import crypto from 'crypto';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const keys = await prisma.apiKey.findMany({
      where: session.role === 'ADMIN' ? {} : { userId: session.id },
      orderBy: { createdAt: 'desc' }
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

    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    // Generate a secure random key
    const rawKey = crypto.randomBytes(32).toString('hex');
    const apiKeyPrefix = 'yn_'; // YOURLS Node prefix
    const fullKey = apiKeyPrefix + rawKey;

    const newKey = await prisma.apiKey.create({
      data: {
        key: fullKey,
        name,
        userId: session.id
      }
    });

    return NextResponse.json({ success: true, data: newKey });
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

    // Ensure user owns the key or is admin
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
