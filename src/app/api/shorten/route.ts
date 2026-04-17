import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { isBlacklisted } from '@/lib/blacklist';

// List of reserved keywords to prevent users from overriding system routes
const RESERVED_KEYWORDS = [
  'admin', 'api', 'login', 'stats', 'protected', 'auth', 'export', 
  'dashboard', 'config', 'settings', 'public', 'css', 'js', 'images', 'favicon.ico'
];

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

export async function POST(request: Request) {
  try {
    const { url, customKeyword, title, redirectType } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Check domain blacklist
    if (isBlacklisted(url)) {
      return NextResponse.json({ error: 'This domain is blacklisted due to security reasons' }, { status: 403 });
    }

    const keyword = customKeyword && customKeyword.trim() !== ''
      ? customKeyword.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : nanoid(6);

    if (!keyword) {
      return NextResponse.json({ error: 'Invalid keyword' }, { status: 400 });
    }

    // Check reserved keywords
    if (RESERVED_KEYWORDS.includes(keyword)) {
      return NextResponse.json({ error: 'Keyword is reserved for system use' }, { status: 400 });
    }

    const existing = await prisma.url.findUnique({
      where: { keyword }
    });

    if (existing) {
      return NextResponse.json({ error: 'Keyword already in use' }, { status: 409 });
    }

    let finalTitle = title?.trim() || null;
    if (!finalTitle) {
      finalTitle = await fetchPageTitle(url);
    }

    const newUrl = await prisma.url.create({
      data: {
        keyword,
        url,
        title: finalTitle,
        redirectType: redirectType === 301 ? 301 : 302, // Default to 302 for safety if not specified
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
      }
    });

    return NextResponse.json({ success: true, data: newUrl });
  } catch (error) {
    console.error('Error shortening URL:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
