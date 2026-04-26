import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { isBlacklisted } from '@/lib/blacklist';
import { fetchMetadata } from '@/lib/metadata';
import { getSession } from '@/lib/session';

// List of reserved keywords to prevent users from overriding system routes
const RESERVED_KEYWORDS = [
  'admin', 'api', 'login', 'stats', 'protected', 'auth', 'export', 
  'dashboard', 'config', 'settings', 'public', 'css', 'js', 'images', 'favicon.ico'
];

export async function POST(request: Request) {
  try {
    const session = await getSession();
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

    console.log('[shorten] Generated keyword:', keyword);

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

    // Fetch Metadata if not provided
    let finalTitle = title?.trim() || null;
    let finalFavicon: string | null = null;

    try {
      const metadata = await fetchMetadata(url);
      finalTitle = finalTitle || metadata.title;
      finalFavicon = metadata.favicon;
    } catch (metaError) {
      console.error('Metadata fetch failed:', metaError);
    }

    const newUrl = await prisma.url.create({
      data: {
        keyword,
        url,
        title: finalTitle,
        favicon: finalFavicon,
        redirectType: redirectType === 301 ? 301 : 302,
        userId: session?.id || null,
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
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const validSortFields = ['createdAt', 'clicks', 'keyword', 'url'];
    const finalSort = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Multitenancy: Filter by userId unless admin
    const where: any = {};
    if (session && session.role !== 'ADMIN') {
      where.userId = session.id;
    }

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
    const session = await getSession();
    const { keywords } = await request.json();
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'Keywords array is required' }, { status: 400 });
    }

    // Security check: must own the links or be admin
    const deleteWhere: any = { keyword: { in: keywords } };
    if (session && session.role !== 'ADMIN') {
      deleteWhere.userId = session.id;
    }

    const result = await prisma.url.deleteMany({
      where: deleteWhere
    });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error('Error bulk deleting:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

