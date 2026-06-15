/**
 * Paginated, searchable list of links with per-range click counts.
 * Powers the "Explorador de estadísticas" on /admin/stats. Each row carries
 * preliminary stats (total clicks + clicks within the selected time range)
 * and links through to the individual /admin/stats/[keyword] view.
 *
 * Authenticated via getSession() (cookie or x-api-key). Non-admins only see
 * their own links.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

const RANGE_DAYS: Record<string, number | null> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

const ALLOWED_LIMITS = [10, 25, 50, 100];
const SORT_FIELDS = ['createdAt', 'clicks', 'keyword'] as const;
type SortField = (typeof SORT_FIELDS)[number];

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sp = new URL(request.url).searchParams;

    const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
    const limitRaw = parseInt(sp.get('limit') || '25', 10) || 25;
    const limit = ALLOWED_LIMITS.includes(limitRaw) ? limitRaw : 25;
    const search = (sp.get('search') || '').trim();
    const sortByRaw = sp.get('sortBy') || 'createdAt';
    const sortBy: SortField = (SORT_FIELDS as readonly string[]).includes(sortByRaw)
      ? (sortByRaw as SortField)
      : 'createdAt';
    const sortOrder = sp.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const rangeParam = sp.get('range') || '7d';
    const range = rangeParam in RANGE_DAYS ? rangeParam : '7d';
    const days = RANGE_DAYS[range];
    const since =
      days === null ? null : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {};
    if (session.role !== 'ADMIN') where.userId = session.id;
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
        select: {
          keyword: true,
          url: true,
          title: true,
          favicon: true,
          isHealthy: true,
          clicks: true,
          createdAt: true,
          redirectType: true,
          password: true,
        },
      }),
      prisma.url.count({ where }),
    ]);

    // Per-range click counts for just the keywords on this page (efficient).
    const keywords = urls.map((u) => u.keyword);
    const rangeMap = new Map<string, number>();
    if (since && keywords.length > 0) {
      const grouped = await prisma.log.groupBy({
        by: ['shorturl'],
        where: { shorturl: { in: keywords }, clickedAt: { gte: since } },
        _count: { _all: true },
      });
      for (const g of grouped) rangeMap.set(g.shorturl, g._count._all);
    }

    const data = urls.map(({ password, clicks, ...rest }) => ({
      ...rest,
      clicks,
      rangeClicks: since ? rangeMap.get(rest.keyword) ?? 0 : clicks,
      hasPassword: Boolean(password),
      createdAt: rest.createdAt.toISOString(),
    }));

    return NextResponse.json({
      data,
      range,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[stats/links]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
