/**
 * CSV export of the link list with preliminary stats, honouring the active
 * search query and time range from the stats explorer. Exports every matching
 * link (not just the current page). Non-admins only export their own links.
 */
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

const RANGE_DAYS: Record<string, number | null> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sp = new URL(request.url).searchParams;
  const search = (sp.get('search') || '').trim();
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

  const urls = await prisma.url.findMany({
    where,
    orderBy: { clicks: 'desc' },
    take: 50000,
    select: {
      keyword: true,
      url: true,
      title: true,
      clicks: true,
      createdAt: true,
      redirectType: true,
      isHealthy: true,
    },
  });

  const rangeMap = new Map<string, number>();
  if (since && urls.length > 0) {
    const grouped = await prisma.log.groupBy({
      by: ['shorturl'],
      where: {
        shorturl: { in: urls.map((u) => u.keyword) },
        clickedAt: { gte: since },
      },
      _count: { _all: true },
    });
    for (const g of grouped) rangeMap.set(g.shorturl, g._count._all);
  }

  const rangeLabel = range === 'all' ? 'clics_totales' : `clics_${range}`;
  const header = [
    'palabra_clave',
    'url_destino',
    'titulo',
    'clics_totales',
    rangeLabel,
    'tipo_redireccion',
    'activo',
    'creado',
  ].join(',');

  const lines = urls.map((u) =>
    [
      u.keyword,
      u.url,
      u.title || '',
      u.clicks,
      since ? rangeMap.get(u.keyword) ?? 0 : u.clicks,
      u.redirectType,
      u.isHealthy ? 'si' : 'no',
      u.createdAt.toISOString(),
    ]
      .map(csvEscape)
      .join(','),
  );

  const body = [header, ...lines].join('\n') + '\n';
  const filename = `estadisticas-enlaces-${range}-${Date.now()}.csv`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
