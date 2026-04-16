import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

// Utility: fetch the <title> from a URL
async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'YOURLS-Node/1.0 (+link-preview)' },
    });
    clearTimeout(timeout);
    const html = await res.text();
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim().substring(0, 200) : null;
  } catch {
    return null;
  }
}

// POST — Create a new shortened URL
export async function POST(request: Request) {
  try {
    const { url, customKeyword, title } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Determine keyword
    const keyword = customKeyword && customKeyword.trim() !== ''
      ? customKeyword.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : nanoid(6);

    if (!keyword) {
      return NextResponse.json({ error: 'Invalid keyword' }, { status: 400 });
    }

    // Check if keyword exists
    const existing = await prisma.url.findUnique({
      where: { keyword }
    });

    if (existing) {
      return NextResponse.json({ error: 'Keyword already in use' }, { status: 409 });
    }

    // Auto-fetch title if not provided
    let finalTitle = title?.trim() || null;
    if (!finalTitle) {
      finalTitle = await fetchPageTitle(url);
    }

    // Create the new shortened URL
    const newUrl = await prisma.url.create({
      data: {
        keyword,
        url,
        title: finalTitle,
        ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
      }
    });

    return NextResponse.json({ success: true, data: newUrl });
  } catch (error) {
    console.error('Error shortening URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET — List all URLs with search and pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const validSortFields = ['createdAt', 'clicks', 'keyword', 'url'];
    const finalSort = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const where = search
      ? {
          OR: [
            { keyword: { contains: search } },
            { url: { contains: search } },
            { title: { contains: search } },
          ],
        }
      : {};

    const [urls, total] = await Promise.all([
      prisma.url.findMany({
        where,
        orderBy: { [finalSort]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.url.count({ where }),
    ]);

    return NextResponse.json({
      data: urls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing URLs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE — Bulk delete
export async function DELETE(request: Request) {
  try {
    const { keywords } = await request.json();
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'Keywords array is required' }, { status: 400 });
    }

    await prisma.url.deleteMany({
      where: { keyword: { in: keywords } }
    });

    return NextResponse.json({ success: true, deleted: keywords.length });
  } catch (error) {
    console.error('Error bulk deleting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
