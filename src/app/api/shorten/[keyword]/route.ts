import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET — Get single URL details
export async function GET(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const params = await context.params;
  try {
    const urlEntry = await prisma.url.findUnique({
      where: { keyword: params.keyword },
      include: { logs: { orderBy: { clickedAt: 'desc' }, take: 10 } }
    });

    if (!urlEntry) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    return NextResponse.json({ data: urlEntry });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH — Update URL destination and/or title
export async function PATCH(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const params = await context.params;
  try {
    const body = await request.json();
    const data: { url?: string; title?: string } = {};

    if (body.url !== undefined) {
      // Validate URL
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
      data.url = body.url;
    }

    if (body.title !== undefined) {
      data.title = body.title || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await prisma.url.update({
      where: { keyword: params.keyword },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error updating URL' }, { status: 500 });
  }
}

// DELETE — Delete a single URL
export async function DELETE(request: Request, context: { params: Promise<{ keyword: string }> }) {
  const params = await context.params;
  try {
    await prisma.url.delete({
      where: { keyword: params.keyword }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error deleting URL' }, { status: 500 });
  }
}
